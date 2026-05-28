import prisma from "../../prisma.js";

export const findTransactionsForUser = (userId) => {
    return prisma.transaction.findMany({
        where: { fromUserId: userId },
        include: {
            category: {
                select: { name: true, type: true },
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

        if (type === "TRANSFER" || type === "WITHDRAWAL") {
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

        return transaction;
    });
};

export const updateTransactionCategory = (transactionId, categoryId) => {
    return prisma.transaction.update({
        where: { id: Number(transactionId) },
        data: { category: { connect: { id: categoryId } } },
    });
};
