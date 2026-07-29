import prisma from "../../prisma.js";

export const createSplitRequests = (dataArray) => {
    return prisma.splitRequest.createMany({
        data: dataArray,
    });
};

export const findSplitById = (id) => {
    return prisma.splitRequest.findUnique({
        where: { id },
        include: {
            requester: {
                select: { id: true, name: true, email: true },
            },
            payer: {
                select: { id: true, name: true, email: true },
            },
            transaction: true,
        },
    });
};

export const findIncomingPendingSplits = (userId) => {
    return prisma.splitRequest.findMany({
        where: {
            payerId: userId,
            status: "PENDING",
        },
        include: {
            requester: {
                select: { id: true, name: true, email: true },
            },
            transaction: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const findOutgoingSplits = (userId) => {
    return prisma.splitRequest.findMany({
        where: {
            requesterId: userId,
        },
        include: {
            payer: {
                select: { id: true, name: true, email: true },
            },
            transaction: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const findTransactionForSplit = (transactionId) => {
    return prisma.transaction.findUnique({
        where: { id: Number(transactionId) },
    });
};

export const countUsersForSplit = (userIds) => {
    return prisma.user.count({
        where: { id: { in: userIds } },
    });
};

export const updateSplitStatus = (splitId, status) => {
    return prisma.splitRequest.update({
        where: { id: splitId },
        data: { status },
    });
};

export const settleSplitRequestTransaction = (payerId, splitId) => {
    return prisma.$transaction(async (tx) => {
        const split = await tx.splitRequest.findUnique({
            where: { id: splitId },
        });

        if (!split) {
            throw new Error("Split request not found");
        }

        if (split.payerId !== payerId) {
            throw new Error("You are not authorized to settle this split request");
        }

        if (split.status !== "PENDING") {
            throw new Error("This split request is already settled or rejected");
        }

        const amount = Number(split.amountOwed);
        const requesterId = split.requesterId;
        const [firstId, secondId] = payerId < requesterId ? [payerId, requesterId] : [requesterId, payerId];

        // Acquire locks in deterministic order to prevent deadlocks
        await tx.$queryRaw`SELECT id FROM User WHERE id = ${firstId} FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM User WHERE id = ${secondId} FOR UPDATE`;

        const payerUser = await tx.user.findUnique({
            where: { id: payerId },
        });

        if (Number(payerUser.balance) < amount) {
            throw new Error("Insufficient wallet balance to pay split share");
        }

        await tx.user.update({
            where: { id: payerId },
            data: { balance: { decrement: amount } },
        });

        await tx.user.update({
            where: { id: requesterId },
            data: { balance: { increment: amount } },
        });

        const updatedSplit = await tx.splitRequest.update({
            where: { id: splitId },
            data: { status: "PAID" },
        });

        const settlementTx = await tx.transaction.create({
            data: {
                amount,
                type: "TRANSFER",
                method: "SYSTEM",
                status: "SUCCESS",
                fromUserId: payerId,
                toUserId: requesterId,
                reference: `SPLIT-${splitId.slice(0, 8).toUpperCase()}`,
            },
        });

        return {
            message: "Split share paid successfully",
            split: updatedSplit,
            transaction: settlementTx,
        };
    });
};

