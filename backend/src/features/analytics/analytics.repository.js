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
export const getSpendingGroupedByCategory = async (userId, startDate) => {
    const transactions = await prisma.transaction.findMany({
        where: {
            fromUserId: userId,
            status: "SUCCESS",
            createdAt: {
                gte: startDate,
            },
            category: {
                type: "EXPENSE",
            },
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    const categoryMap = {};
    let totalSpending = 0;
    transactions.forEach((tx) => {
        const catName = tx.category ? tx.category.name : "Uncategorized";
        const amount = Number(tx.amount) || 0;
        categoryMap[catName] = (categoryMap[catName] || 0) + amount;
        totalSpending += amount;
    });
    return {
        totalSpending,
        categories: Object.entries(categoryMap).map(([category, amount]) => ({
            category,
            amount,
        })),
    };
};

export const findDueSubscriptions = (userId, now) => {
    return prisma.subscription.findMany({
        where: {
            userId,
            nextBillingDate: { lte: now },
        },
    });
};

export const findOrCreateBillsCategory = async () => {
    let billsCategory = await prisma.category.findFirst({
        where: { name: "Bills" },
    });
    if (!billsCategory) {
        billsCategory = await prisma.category.create({
            data: {
                name: "Bills",
                type: "EXPENSE",
                isSystem: true,
            },
        });
    }
    return billsCategory;
};

export const processSubscriptionAutoDeduction = async (userId, sub, billsCategoryId, nextBillingDate) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
    });

    const subAmount = Number(sub.amount);
    const userBalance = Number(user.balance);

    if (userBalance < subAmount) {
        return { success: false, amount: subAmount };
    }

    await prisma.$transaction(async (tx) => {
        await tx.user.update({
            where: { id: userId },
            data: { balance: { decrement: sub.amount } },
        });

        await tx.transaction.create({
            data: {
                amount: sub.amount,
                type: "WITHDRAWAL",
                status: "SUCCESS",
                method: "SYSTEM",
                fromUserId: userId,
                categoryId: billsCategoryId || undefined,
                reference: `SUB-${sub.id}-${Date.now()}`,
            },
        });

        await tx.subscription.update({
            where: { id: sub.id },
            data: { nextBillingDate },
        });
    });

    return { success: true, amount: subAmount };
};