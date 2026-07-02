import prisma from "../../prisma.js";

export const addMoneyTransaction = (userId, amount) => {
    return prisma.$transaction(async (tx) => {
        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { balance: { increment: amount } },
        });

        await tx.transaction.create({
            data: {
                amount,
                type: "DEPOSIT",
                status: "SUCCESS",
                fromUserId: null,
                toUserId: userId,
            },
        });

        return updatedUser;
    });
};

export const sendMoneyTransaction = (senderId, receiverId, amount) => {
    return prisma.$transaction(async (tx) => {
        const [firstId, secondId] = senderId < receiverId ? [senderId, receiverId] : [receiverId, senderId];

        // Acquire locks in deterministic order to prevent deadlocks
        await tx.$queryRaw`SELECT id FROM User WHERE id = ${firstId} FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM User WHERE id = ${secondId} FOR UPDATE`;

        const sender = await tx.user.findUnique({ where: { id: senderId } });
        if (!sender) throw new Error("Sender not found");

        if (Number(sender.balance) < amount) throw new Error("Insufficient balance");

        const receiver = await tx.user.findUnique({
            where: { id: receiverId },
        });
        if (!receiver) throw new Error("Receiver not found");

        const updatedSender = await tx.user.update({
            where: { id: senderId },
            data: { balance: { decrement: amount } },
        });

        await tx.user.update({
            where: { id: receiverId },
            data: { balance: { increment: amount } },
        });

        await tx.transaction.create({
            data: {
                amount,
                type: "TRANSFER",
                status: "SUCCESS",
                fromUserId: senderId,
                toUserId: receiverId,
            },
        });

        return { senderBalance: updatedSender.balance };
    });
};

export const withdrawMoneyTransaction = (userId, amount) => {
    return prisma.$transaction(async (tx) => {
        // Acquire locking read to prevent concurrent withdrawals race conditions
        await tx.$queryRaw`SELECT id FROM User WHERE id = ${userId} FOR UPDATE`;

        const user = await tx.user.findUnique({ where: { id: userId } });

        if (!user) throw new Error("User not found");

        if (Number(user.balance) < amount) throw new Error("Insufficient balance");

        const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { balance: { decrement: amount } },
        });

        await tx.transaction.create({
            data: {
                amount,
                type: "WITHDRAWAL",
                status: "SUCCESS",
                fromUserId: userId,
                toUserId: null,
            },
        });

        return updatedUser;
    });
};

export const findWalletTransactions = ({ userId, limit, cursor, from, to }) => {
    const where = {
        OR: [{ fromUserId: userId }, { toUserId: userId }],
    };

    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(from);
        if (to) where.createdAt.lte = new Date(to);
    }

    return prisma.transaction.findMany({
        where,
        orderBy: { id: "desc" },
        take: limit + 1,
        ...(cursor && {
            cursor: { id: cursor },
            skip: 1,
        }),
    });
};
