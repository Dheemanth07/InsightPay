import prisma from "../../prisma.js";

export const getSubscriptionsByUserId = (userId) => {
    return prisma.subscription.findMany({
        where: { userId },
        include: {
            card: {
                select: {
                    id: true,
                    last4: true,
                    brand: true,
                    issuerBank: true,
                    expiryMonth: true,
                    expiryYear: true,
                },
            },
        },
    });
};

export const getUpcomingSubscriptions = (userId, startDate, endDate) => {
    return prisma.subscription.findMany({
        where: {
            userId,
            nextBillingDate: {
                gte: startDate,
                lte: endDate,
            },
        },
        include: {
            card: {
                select: {
                    id: true,
                    last4: true,
                    brand: true,
                    issuerBank: true,
                    expiryMonth: true,
                    expiryYear: true,
                },
            },
        },
        orderBy: {
            nextBillingDate: "asc",
        },
    });
};

export const createSubscription = (data) => {
    return prisma.subscription.create({
        data,
        include: {
            card: {
                select: {
                    id: true,
                    last4: true,
                    brand: true,
                    issuerBank: true,
                    expiryMonth: true,
                    expiryYear: true,
                },
            },
        },
    });
};
