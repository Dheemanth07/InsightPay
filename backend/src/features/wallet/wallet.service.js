import {
    addMoneyTransaction,
    findWalletTransactions,
    sendMoneyTransaction,
} from "./wallet.repository.js";

export const addMoneyService = (userId, amount) => {
    return addMoneyTransaction(userId, amount);
};

export const sendMoneyService = (senderId, receiverId, amount) => {
    return sendMoneyTransaction(senderId, receiverId, amount);
};

export const getTransactionHistoryService = async (
    userId,
    limit,
    cursor,
    type,
    from,
    to,
) => {
    const transactions = await findWalletTransactions({
        userId,
        limit,
        cursor,
        from,
        to,
    });

    const hasNextPage = transactions.length > limit;
    if (hasNextPage) transactions.pop();

    let formatted = transactions.map((transaction) => {
        const isSender = transaction.fromUserId === userId;

        return {
            id: transaction.id,
            amount: transaction.amount,
            direction: isSender ? "SEND" : "RECEIVE",
            signedAmount: isSender
                ? -Number(transaction.amount)
                : Number(transaction.amount),
            status: transaction.status,
            createdAt: transaction.createdAt,
            fromUserId: transaction.fromUserId,
            toUserId: transaction.toUserId,
        };
    });

    if (type === "SEND" || type === "RECEIVE") {
        formatted = formatted.filter(
            (transaction) => transaction.direction === type,
        );
    }

    return {
        transactions: formatted,
        nextCursor: hasNextPage ? formatted[formatted.length - 1]?.id : null,
    };
};
