import {
    getUpcomingSubscriptions,
    getSubscriptionsByUserId,
    createSubscription,
    getSpendingGroupedByCategory,
} from "./analytics.repository.js";
import prisma from "../../prisma.js";

const seedMockSubscriptions = async (userId) => {
    // Check if the user has any cards saved
    const cards = await prisma.card.findMany({ where: { userId } });
    if (cards.length === 0) {
        return [];
    }

    const mockData = [
        {
            merchantName: "Netflix Premium",
            amount: 649.00,
            billingCycle: "MONTHLY",
            offsetDays: 2,
        },
        {
            merchantName: "Spotify Duo",
            amount: 179.00,
            billingCycle: "MONTHLY",
            offsetDays: 5,
        },
        {
            merchantName: "Gym Membership",
            amount: 2499.00,
            billingCycle: "MONTHLY",
            offsetDays: 4,
        },
        {
            merchantName: "Amazon Prime",
            amount: 299.00,
            billingCycle: "MONTHLY",
            offsetDays: 6,
        },
        {
            merchantName: "AWS Cloud Hosting",
            amount: 1420.50,
            billingCycle: "MONTHLY",
            offsetDays: 10, // outside the 7 days window
        },
    ];

    const created = [];
    for (let i = 0; i < mockData.length; i++) {
        const item = mockData[i];
        const card = cards[i % cards.length];
        const nextBillingDate = new Date();
        nextBillingDate.setDate(nextBillingDate.getDate() + item.offsetDays);

        const sub = await createSubscription({
            userId,
            cardId: card.id,
            merchantName: item.merchantName,
            amount: item.amount,
            billingCycle: item.billingCycle,
            nextBillingDate,
        });
        created.push(sub);
    }
    return created;
};

export const getUpcomingLiabilitiesForUser = async (userId) => {
    // 1. Fetch user's subscriptions
    let allSubscriptions = await getSubscriptionsByUserId(userId);

    // 2. Auto-seed if user has cards but 0 subscriptions
    if (allSubscriptions.length === 0) {
        const seeded = await seedMockSubscriptions(userId);
        if (seeded.length > 0) {
            allSubscriptions = seeded;
        }
    }

    // 3. Define the next 7 days range (including today)
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59, 999);

    const upcoming = await getUpcomingSubscriptions(userId, startDate, endDate);

    const totalAmount = upcoming.reduce((sum, item) => sum + Number(item.amount), 0);

    return {
        upcomingLiabilities: upcoming,
        totalAmount,
    };
};

const generateMockRoast = (totalSpending, categories) => {
    if (categories.length === 0 || totalSpending === 0) {
        return "You haven't spent anything this month. Keep it up, though sitting in an empty room staring at the wall isn't much of a lifestyle.";
    }

    // Sort categories descending
    const sorted = [...categories].sort((a, b) => b.amount - a.amount);
    const top = sorted[0];

    const roasts = {
        Food: `You blew ₹${top.amount} on food this month. Stop ordering takeout every single night and learn to use a stove.`,
        Entertainment: `You spent ₹${top.amount} on entertainment. You're trying way too hard to escape your boring reality instead of saving.`,
        Shopping: `You spent ₹${top.amount} on shopping. Buying more things won't fill the void in your bank account, put down the credit card.`,
        Bills: `You spent ₹${top.amount} on bills. At least it's essential, but verify if you're keeping subscription services active that you never use.`,
        Travel: `You spent ₹${top.amount} on traveling. Unless you're fleeing the country to escape your debt, stay at home next month.`,
        Uncategorized: `You spent ₹${top.amount} on uncategorized things. If you don't even know what you're spending on, your budget is a lost cause.`,
    };

    const topCategoryLower = top.category.toLowerCase();
    const fallbackRoast = `You spent ₹${top.amount} on ${topCategoryLower} this month, making it your highest expense. Cut this down by 20% next month to start building actual savings.`;

    let roast = roasts[top.category] || fallbackRoast;
    
    if (!roast.includes("?") && !roast.includes("!")) {
        roast += " Cook at home or stop shopping to stay on track.";
    }
    
    return roast;
};

export const generateFinancialInsights = async (userId) => {
    // 1. Define start date (30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // 2. Fetch spending grouped by category
    const { totalSpending, categories } = await getSpendingGroupedByCategory(userId, thirtyDaysAgo);

    // 3. Define the strict system prompt
    const systemPrompt = `You are a blunt, minimalist financial advisor and roaster for InsightPay. Your job is to analyze the user's spending data for the last 30 days and deliver a direct, slightly sarcastic, and plain-English roast or advice.
Follow these strict rules:
1. Do NOT use bullet points, corporate jargon, greetings, introductions, or generic praise.
2. Output a maximum of two sentences.
3. Be blunt, direct, and slightly harsh but highly practical.
4. Give specific advice based on their highest spending categories.`;

    const userPrompt = `Here is my spending data grouped by category for the last 30 days.
Total Spending: ₹${totalSpending}
Breakdown:
${categories.map(c => `- ${c.category}: ₹${c.amount}`).join('\n')}

Roast my spending and give me one clear action item.`;

    // 4. Connect to LLM API if configured
    if (process.env.GEMINI_API_KEY) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: userPrompt,
                                    },
                                ],
                            },
                        ],
                        systemInstruction: {
                            parts: [
                                {
                                    text: systemPrompt,
                                },
                            ],
                        },
                        generationConfig: {
                            maxOutputTokens: 150,
                            temperature: 0.7,
                        },
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
                        {
                            role: "system",
                            content: systemPrompt,
                        },
                        {
                            role: "user",
                            content: userPrompt,
                        },
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

    // 5. Fallback to mock roaster if no keys configured or API failed
    return generateMockRoast(totalSpending, categories);
};
