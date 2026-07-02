import {
    createSplitRequests,
    findSplitById,
    findIncomingPendingSplits,
    findOutgoingSplits,
} from "./split.repository.js";
import prisma from "../../prisma.js";

export const initiateSplit = async (requesterId, { transactionId, splits }) => {
    const transaction = await prisma.transaction.findUnique({
        where: { id: Number(transactionId) },
    });

    if (!transaction) {
        const error = new Error("Original transaction not found");
        error.statusCode = 404;
        throw error;
    }

    if (transaction.fromUserId !== requesterId && transaction.toUserId !== requesterId) {
        const error = new Error("You cannot split a transaction you are not part of");
        error.statusCode = 403;
        throw error;
    }

    if (!splits || !Array.isArray(splits) || splits.length === 0) {
        const error = new Error("At least one split recipient is required");
        error.statusCode = 400;
        throw error;
    }

    const payerIds = splits.map(s => Number(s.payerId));
    const uniquePayers = [...new Set(payerIds)];
    
    if (uniquePayers.includes(requesterId)) {
        const error = new Error("You cannot split an expense with yourself");
        error.statusCode = 400;
        throw error;
    }

    const usersCount = await prisma.user.count({
        where: { id: { in: uniquePayers } },
    });

    if (usersCount !== uniquePayers.length) {
        const error = new Error("One or more split recipients are invalid");
        error.statusCode = 400;
        throw error;
    }

    const data = splits.map(s => ({
        transactionId: Number(transactionId),
        requesterId,
        payerId: Number(s.payerId),
        amountOwed: s.amountOwed,
        status: "PENDING",
    }));

    await createSplitRequests(data);

    return { message: "Split requests created successfully" };
};

export const paySplitShare = async (payerId, splitId) => {
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

export const rejectSplitShare = async (payerId, splitId) => {
    const split = await findSplitById(splitId);
    if (!split) {
        const error = new Error("Split request not found");
        error.statusCode = 404;
        throw error;
    }

    if (split.payerId !== payerId) {
        const error = new Error("You are not authorized to reject this split request");
        error.statusCode = 403;
        throw error;
    }

    if (split.status !== "PENDING") {
        const error = new Error("This split request is already settled or rejected");
        error.statusCode = 400;
        throw error;
    }

    return prisma.splitRequest.update({
        where: { id: splitId },
        data: { status: "REJECTED" },
    });
};

export const getIncomingPendingSplitsForUser = (userId) => {
    return findIncomingPendingSplits(userId);
};

export const getOutgoingSplitsForUser = (userId) => {
    return findOutgoingSplits(userId);
};
