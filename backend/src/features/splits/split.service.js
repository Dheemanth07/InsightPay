import {
    countUsersForSplit,
    createSplitRequests,
    findIncomingPendingSplits,
    findOutgoingSplits,
    findSplitById,
    findTransactionForSplit,
    settleSplitRequestTransaction,
    updateSplitStatus,
} from "./split.repository.js";

export const initiateSplit = async (requesterId, { transactionId, splits }) => {
    const transaction = await findTransactionForSplit(transactionId);

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

    const usersCount = await countUsersForSplit(uniquePayers);

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
    return settleSplitRequestTransaction(payerId, splitId);
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

    return updateSplitStatus(splitId, "REJECTED");
};

export const getIncomingPendingSplitsForUser = (userId) => {
    return findIncomingPendingSplits(userId);
};

export const getOutgoingSplitsForUser = (userId) => {
    return findOutgoingSplits(userId);
};

