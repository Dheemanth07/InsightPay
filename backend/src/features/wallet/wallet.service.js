import {
    addMoneyTransaction,
    findWalletTransactions,
    sendMoneyTransaction,
    withdrawMoneyTransaction,
} from "./wallet.repository.js";

export const addMoneyService = (userId, amount) => {
    return addMoneyTransaction(userId, amount);
};

export const sendMoneyService = (senderId, receiverId, amount) => {
    return sendMoneyTransaction(senderId, receiverId, amount);
};

export const withdrawMoneyService = (userId, amount) => {
    return withdrawMoneyTransaction(userId, amount);
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
        const direction =
            transaction.type === "WITHDRAWAL"
                ? "WITHDRAWAL"
                : isSender
                    ? "SEND"
                    : "RECEIVE";

        return {
            id: transaction.id,
            amount: transaction.amount,
            type: transaction.type,
            direction,
            signedAmount:
                direction === "RECEIVE"
                    ? Number(transaction.amount)
                    : -Number(transaction.amount),
            status: transaction.status,
            createdAt: transaction.createdAt,
            fromUserId: transaction.fromUserId,
            toUserId: transaction.toUserId,
        };
    });

    if (type === "SEND" || type === "RECEIVE" || type === "WITHDRAWAL") {
        formatted = formatted.filter(
            (transaction) => transaction.direction === type,
        );
    }

    return {
        transactions: formatted,
        nextCursor: hasNextPage ? formatted[formatted.length - 1]?.id : null,
    };
};
