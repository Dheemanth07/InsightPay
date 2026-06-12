import {
    getUpcomingSubscriptions,
    createSubscription,
    getSpendingGroupedByCategory,
} from "./analytics.repository.js";
// ─────────────────────────────────────────────
// Upcoming liabilities (user-driven, 7-day window)
// ─────────────────────────────────────────────
export const getUpcomingLiabilitiesForUser = async (userId) => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);
    const upcoming = await getUpcomingSubscriptions(userId, startDate, endDate);
    const totalAmount = upcoming.reduce((sum, item) => sum + Number(item.amount), 0);
    return { upcomingLiabilities: upcoming, totalAmount };
};
// ─────────────────────────────────────────────
// Create a new user subscription
// ─────────────────────────────────────────────
export const addUserSubscription = async (userId, { name, amount, dueDate, cardId }) => {
    return createSubscription({
        userId,
        cardId,
        name,
        merchantName: name,              // keep legacy field in sync
        amount: parseFloat(amount),
        dueDate: new Date(dueDate),
        nextBillingDate: new Date(dueDate), // keep legacy field in sync
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
                console.error("Gemini API request failed:", response.statusText);
            }
        } catch (err) {
            console.error("Error communicating with Gemini API:", err);
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
                console.error("OpenAI API request failed:", response.statusText);
            }
        } catch (err) {
            console.error("Error communicating with OpenAI API:", err);
        }
    }
    return generateMockRoast(totalSpending, categories);
};