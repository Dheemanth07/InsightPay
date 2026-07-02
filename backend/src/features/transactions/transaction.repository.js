import prisma from "../../prisma.js";

export const findTransactionsForUser = (userId) => {
    return prisma.transaction.findMany({
        where: {
            OR: [
                { fromUserId: userId },
                { toUserId: userId },
            ],
        },
        include: {
            category: {
                select: { id: true, name: true, type: true },
            },
            fromUser: {
                select: { id: true, name: true },
            },
            toUser: {
                select: { id: true, name: true },
            },
        },
        orderBy: { createdAt: "desc" },
    });
};

export const createTransactionWithBalanceUpdate = (
    userId,
    { amount, type, categoryId },
) => {
    return prisma.$transaction(async (tx) => {
        if (type === "TRANSFER" || type === "WITHDRAWAL") {
            // Lock the user row
            await tx.$queryRaw`SELECT id FROM User WHERE id = ${userId} FOR UPDATE`;

            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user || Number(user.balance) < amount) {
                throw new Error("Insufficient balance");
            }

            await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: amount } },
            });
        }

        if (type === "DEPOSIT") {
            await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } },
            });
        }

        const transaction = await tx.transaction.create({
            data: {
                amount,
                type,
                status: "SUCCESS",
                fromUser: {
                    connect: { id: userId },
                },
                category: {
                    connect: { id: categoryId },
                },
            },
        });

        return transaction;
    });
};

export const updateTransactionCategory = (transactionId, categoryId, userId) => {
    return prisma.$transaction(async (tx) => {
        const category = await tx.category.findFirst({
            where: { id: categoryId, userId },
            select: { id: true },
        });

        if (!category) {
            const error = new Error("Category not found");
            error.statusCode = 404;
            throw error;
        }

        const transaction = await tx.transaction.findFirst({
            where: {
                id: Number(transactionId),
                OR: [{ fromUserId: userId }, { toUserId: userId }],
            },
            select: { id: true, status: true },
        });

        if (!transaction) {
            const error = new Error("Transaction not found");
            error.statusCode = 404;
            throw error;
        }

        if (transaction.status !== "SUCCESS") {
            const error = new Error("Only successful transactions can be categorized");
            error.statusCode = 400;
            throw error;
        }

        return tx.transaction.update({
            where: { id: Number(transactionId) },
            data: { category: { connect: { id: categoryId } } },
            include: {
                category: {
                    select: { id: true, name: true, type: true },
                },
                fromUser: {
                    select: { id: true, name: true },
                },
                toUser: {
                    select: { id: true, name: true },
                },
            },
        });
    });
};
