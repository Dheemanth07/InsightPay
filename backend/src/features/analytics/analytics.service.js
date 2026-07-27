import {
    getUpcomingSubscriptions,
    createSubscription,
    getSpendingGroupedByCategory,
} from "./analytics.repository.js";
import logger from "../../utils/logger.js";
import prisma from "../../prisma.js";


// ─────────────────────────────────────────────
// Upcoming liabilities (user-driven, 7-day window)
// ─────────────────────────────────────────────
export const getUpcomingLiabilitiesForUser = async (userId) => {
    const now = new Date();

    // 1. Process Due/Overdue Bills Auto-Deduction Engine
    const dueSubscriptions = await prisma.subscription.findMany({
        where: {
            userId,
            nextBillingDate: { lte: now },
        },
    });

    const autoDeductedEvents = [];
    const insufficientBalanceEvents = [];

    if (dueSubscriptions.length > 0) {
        // Find or create 'Bills' category
        let billsCategory = await prisma.category.findFirst({
            where: { name: "Bills" },
        });

        for (const sub of dueSubscriptions) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { balance: true },
            });

            const subAmount = Number(sub.amount);
            const userBalance = Number(user.balance);

            if (userBalance >= subAmount) {
                // Sufficient Balance -> Process Auto-Deduction
                await prisma.$transaction(async (tx) => {
                    await tx.user.update({
                        where: { id: userId },
                        data: { balance: { decrement: sub.amount } },
                    });

                    await tx.transaction.create({
                        data: {
                            fromUserId: userId,
                            amount: sub.amount,
                            type: "WITHDRAWAL",
                            method: "SYSTEM",
                            status: "SUCCESS",
                            reference: `AUTO_BILL_${sub.id.slice(0, 8)}_${Date.now()}`,
                            categoryId: billsCategory?.id || null,
                        },
                    });

                    // Advance nextBillingDate to future date
                    let nextDate = new Date(sub.nextBillingDate);
                    while (nextDate <= now) {
                        nextDate.setMonth(nextDate.getMonth() + 1);
                    }

                    await tx.subscription.update({
                        where: { id: sub.id },
                        data: { nextBillingDate: nextDate },
                    });
                });

                autoDeductedEvents.push({
                    id: sub.id,
                    merchantName: sub.merchantName,
                    amount: subAmount,
                });
                logger.info({ userId, subId: sub.id, amount: subAmount }, "Auto-debited bill payment");
            } else {
                // Insufficient Balance -> Notify User
                insufficientBalanceEvents.push({
                    id: sub.id,
                    merchantName: sub.merchantName,
                    amount: subAmount,
                });
            }
        }
    }

    // 2. Fetch Upcoming Subscriptions for Next 7 Days
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);
    const upcoming = await getUpcomingSubscriptions(userId, startDate, endDate);
    const totalAmount = upcoming.reduce((sum, item) => sum + Number(item.amount), 0);

    const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
    });

    const userBalance = Number(currentUser?.balance || 0);

    return {
        upcomingLiabilities: upcoming,
        totalAmount,
        userBalance,
        insufficientBalanceWarning: userBalance < totalAmount,
        autoDeductedEvents,
        insufficientBalanceEvents,
    };
};
// ─────────────────────────────────────────────
export const addUserSubscription = async (userId, { name, amount, dueDate, cardId }) => {
    return createSubscription({
        userId,
        cardId,
        merchantName: name,
        amount: parseFloat(amount),
        nextBillingDate: new Date(dueDate),
        billingCycle: "MONTHLY",
    });
};
// ─────────────────────────────────────────────
// Mock roast fallback (no LLM keys)
// ─────────────────────────────────────────────
const generateMockRoast = (totalSpending, categories) => {
    if (categories.length === 0 || totalSpending === 0) {
        return "You haven't spent anything this month. Either you're broke or you're hoarding cash under your mattress.";
    }
    const sorted = [...categories].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];
    const roasts = {
        Food: `You blew ₹${top.amount} on food this month. Stop ordering takeout every single night and learn to use a stove.`,
        Entertainment: `You spent ₹${top.amount} on entertainment. You're trying way too hard to escape your boring reality instead of saving.`,
        Shopping: `You spent ₹${top.amount} on shopping. Buying more things won't fill the void in your bank account—put down the credit card.`,
        Bills: `You spent ₹${top.amount} on bills. Verify you're not keeping subscription services active that you never use.`,
        Travel: `You spent ₹${top.amount} on traveling. Unless you're fleeing the country to escape your debt, stay home next month.`,
    };
    const fallback = `You spent ₹${top.amount} on ${top.category.toLowerCase()} this month—your highest expense. Cut this by 20% next month to start building actual savings.`;
    return roasts[top.category] || fallback;
};
// ─────────────────────────────────────────────
// GenAI financial insights (spending roast)
// ─────────────────────────────────────────────
export const generateFinancialInsights = async (userId) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    const { totalSpending, categories } = await getSpendingGroupedByCategory(userId, thirtyDaysAgo);
    const systemPrompt = `You are a blunt, minimalist financial advisor for InsightPay. Analyze the user's 30-day spending and deliver direct, slightly sarcastic, plain-English advice.
Rules:
1. No bullet points, corporate jargon, greetings, or generic praise.
2. Maximum two sentences.
3. Be blunt, direct, and slightly harsh but practical.
4. Give specific advice based on their highest spending categories.`;
    const userPrompt = `Here is my spending grouped by category for the last 30 days.
Total: ₹${totalSpending}
Breakdown:
${categories.map((c) => `- ${c.category}: ₹${c.amount}`).join("\n")}
Roast my spending and give me one clear action item.`;
    if (process.env.GEMINI_API_KEY) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: userPrompt }] }],
                        systemInstruction: { parts: [{ text: systemPrompt }] },
                        generationConfig: { maxOutputTokens: 150, temperature: 0.7 },
                    }),
                }
            );

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
                if (text) return text;
            } else {
                logger.error({ statusText: response.statusText }, "Gemini API request failed");
            }
        } catch (err) {
            logger.error({ err }, "Error communicating with Gemini API");
        }
    }
    if (process.env.OPENAI_API_KEY) {
        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userPrompt },
                    ],
                    max_tokens: 150,
                    temperature: 0.7,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                const text = data.choices?.[0]?.message?.content?.trim();
                if (text) return text;
            } else {
                logger.error({ statusText: response.statusText }, "OpenAI API request failed");
            }
        } catch (err) {
            logger.error({ err }, "Error communicating with OpenAI API");
        }
    }
    return generateMockRoast(totalSpending, categories);
};

// ─────────────────────────────────────────────
// Helper: call Gemini with a system + user prompt
// ─────────────────────────────────────────────
const callGemini = async (systemPrompt, userPrompt, maxTokens = 80) => {
    if (!process.env.GEMINI_API_KEY) return null;
    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: userPrompt }] }],
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.5 },
                }),
            }
        );
        if (!res.ok) return null;
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch (err) {
        logger.error({ err }, "Gemini call failed");
        return null;
    }
};

// ─────────────────────────────────────────────
// 1. Suggest a category for a transaction description
// ─────────────────────────────────────────────
export const suggestTransactionCategory = async (description, availableCategories) => {
    if (!description || description.trim().length < 2 || !availableCategories || availableCategories.length === 0) return null;

    const categoryList = availableCategories.join(", ");
    const system = `You are a financial categorization assistant. Given a transaction description, return ONLY the single best matching category name from the provided list. No explanation, no punctuation — just the category name exactly as given.`;
    const user = `Transaction: "${description}"
Available categories: ${categoryList}
Best matching category:`;

    const result = await callGemini(system, user, 20);
    if (result && availableCategories.some(c => c.toLowerCase() === result.toLowerCase())) {
        return availableCategories.find(c => c.toLowerCase() === result.toLowerCase());
    }

    // Smart Keyword Matching
    const lowerDesc = description.toLowerCase();
    const keywords = {
        Food: ["food", "swiggy", "zomato", "blinkit", "zepto", "restaurant", "cafe", "coffee", "burger", "pizza", "eat", "dining", "groceries", "bakery", "mcdonalds", "kfc", "starbucks", "bar", "pub", "lunch", "dinner"],
        Shopping: ["shopping", "amazon", "flipkart", "clothes", "shoes", "store", "mall", "myntra", "meesho", "ajio", "electronics", "gadgets", "apparel", "mart"],
        Travel: ["travel", "uber", "ola", "rapido", "flight", "train", "cab", "petrol", "fuel", "taxi", "bus", "auto", "metro", "irctc", "indigo", "makemytrip"],
        Bills: ["electricity", "water", "wifi", "broadband", "rent", "recharge", "mobile", "postpaid", "dth", "cylinder", "gas", "utility", "insurance"],
        Entertainment: ["movie", "cinema", "game", "steam", "spotify", "party", "concert", "prime", "hotstar", "bookmyshow", "youtube", "netflix"],
        Personal: ["sent", "send", "transfer", "p2p", "split", "paid to", "received", "friend", "family", "user", "payment to", "upi transfer"]
    };

    for (const [catGroup, words] of Object.entries(keywords)) {
        if (words.some(w => lowerDesc.includes(w))) {
            const match = availableCategories.find(c => c.toLowerCase().includes(catGroup.toLowerCase()));
            if (match) return match;
        }
    }

    // Fallback: check if there's an 'Other' or 'General' category before returning null (never force Bills)
    const fallbackMatch = availableCategories.find(c => ["other", "general", "miscellaneous", "personal"].includes(c.toLowerCase()));
    return fallbackMatch || null;
};

// ─────────────────────────────────────────────
// 2. Category spending trends (this vs last month)
// ─────────────────────────────────────────────
export const generateCategoryTrends = async (userId) => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);

    const [thisMonth, lastMonth] = await Promise.all([
        getSpendingGroupedByCategory(userId, thisMonthStart),
        getSpendingGroupedByCategory(userId, lastMonthStart),
    ]);

    const thisMap = Object.fromEntries(thisMonth.categories.map(c => [c.category, c.amount]));
    const lastMap = Object.fromEntries(lastMonth.categories.map(c => [c.category, c.amount]));

    // If no categories in DB, fetch all user/system categories
    if (thisMonth.categories.length === 0) {
        const allCats = await prisma.category.findMany({ select: { name: true } });
        return allCats.map(c => ({
            category: c.name,
            direction: "flat",
            percent: 0,
            label: "No recent activity",
        }));
    }

    const trends = [];
    for (const [category, thisAmount] of Object.entries(thisMap)) {
        const lastAmount = lastMap[category] || 0;
        if (lastAmount === 0) {
            trends.push({ category, direction: "new", percent: null, label: "New this month" });
        } else {
            const pct = Math.round(((thisAmount - lastAmount) / lastAmount) * 100);
            trends.push({
                category,
                direction: pct > 0 ? "up" : pct < 0 ? "down" : "flat",
                percent: Math.abs(pct),
                label: pct === 0 ? "Same as last month" : `${Math.abs(pct)}% ${pct > 0 ? "↑" : "↓"} vs last month`,
            });
        }
    }
    return trends;
};

// ─────────────────────────────────────────────
// 3. Spend velocity — burn rate from balance
// ─────────────────────────────────────────────
export const generateSpendVelocity = async (userId) => {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { balance: true } });
    if (!user) return null;

    const balance = Number(user.balance) || 0;
    if (balance <= 0) return null;

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const txs = await prisma.transaction.findMany({
        where: {
            fromUserId: userId,
            status: "SUCCESS",
            createdAt: { gte: fourteenDaysAgo },
            OR: [{ type: "TRANSFER" }, { type: "WITHDRAWAL" }],
        },
        select: { amount: true },
    });

    let dailyRate = 0;
    if (txs.length >= 1) {
        const totalSpent = txs.reduce((s, t) => s + Number(t.amount), 0);
        dailyRate = totalSpent / 14;
    } else {
        // Mock estimate if no recent transactions
        dailyRate = balance * 0.04; // assume ~4% daily spend
    }

    if (dailyRate <= 0) dailyRate = 100;
    const daysRemaining = Math.max(1, Math.round(balance / dailyRate));

    const system = `You are a blunt financial assistant. Write ONE short sentence (under 15 words) describing how long the user's balance will last at their current spend rate. Be direct, no filler words.`;
    const userPrompt = `Balance: ₹${balance.toFixed(0)}, average daily spend: ₹${dailyRate.toFixed(0)}, estimated days remaining: ${daysRemaining}.`;

    const aiMessage = await callGemini(system, userPrompt, 40);
    return {
        daysRemaining,
        dailyRate: Math.round(dailyRate),
        message: aiMessage || `At ₹${Math.round(dailyRate)}/day, your balance covers ~${daysRemaining} more days.`,
    };
};

// ─────────────────────────────────────────────
// 4. Cashflow narrative — interpret 6-month chart
// ─────────────────────────────────────────────
export const generateCashflowNarrative = async (cashFlow) => {
    if (!cashFlow || cashFlow.length === 0) return null;

    const summary = cashFlow
        .map(m => `${m.month}: Income ₹${m.Income}, Expenses ₹${m.Expenses}`)
        .join("\n");

    const system = `You are a blunt financial analyst. Analyze 6 months of income vs expense data and write 2 sentences max. Identify the most notable pattern (spike, consistent overspend, improving trend etc). Be specific with months and numbers. No filler, no praise.`;
    const userPrompt = `Monthly cashflow data:\n${summary}\nWrite a 2-sentence interpretation.`;

    const aiText = await callGemini(system, userPrompt, 120);
    if (aiText) return aiText;

    // Smart Mock Fallback based on cashflow array calculation
    const totalIncome = cashFlow.reduce((s, m) => s + m.Income, 0);
    const totalExpenses = cashFlow.reduce((s, m) => s + m.Expenses, 0);

    if (totalIncome === 0 && totalExpenses === 0) {
        return "No transaction history detected over the last 6 months. Add income or record expenses to generate automated cashflow diagnostics.";
    }

    if (totalExpenses > totalIncome) {
        return `Your total expenses (₹${totalExpenses}) exceeded your total income (₹${totalIncome}) over this 6-month window. Consider auditing recurring category expenses to stabilize net cashflow.`;
    }

    return `Your net cashflow remains healthy with total income of ₹${totalIncome} exceeding expenses of ₹${totalExpenses}. Maintain your current spending pace to keep building your savings.`;
};
