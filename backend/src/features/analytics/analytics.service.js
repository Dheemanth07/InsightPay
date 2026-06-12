import {
    getUpcomingSubscriptions,
    getSubscriptionsByUserId,
    createSubscription,
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
