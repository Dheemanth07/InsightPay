import { getOrCreateCategory } from "../../utils/category.js";
import {
    createTransactionWithBalanceUpdate,
    findTransactionsForUser,
    updateTransactionCategory,
} from "./transaction.repository.js";

const TXN_TYPE_ALIASES = {
    ADD: "DEPOSIT",
    RECEIVE: "DEPOSIT",
    SEND: "WITHDRAWAL",
};

const normalizeTransactionType = (type) => {
    const normalizedType = TXN_TYPE_ALIASES[type] || type;

    if (!["DEPOSIT", "TRANSFER", "WITHDRAWAL"].includes(normalizedType)) {
        const error = new Error("Invalid transaction type");
        error.statusCode = 400;
        throw error;
    }

    return normalizedType;
};

export const getTransactionsForUser = (userId) => {
    return findTransactionsForUser(userId);
};

export const createTransactionForUser = async (
    userId,
    { amount, type, categoryId },
) => {
    const finalType = normalizeTransactionType(type);
    let finalCategoryId = categoryId;

    if (!finalCategoryId) {
        const defaultCategory = await getOrCreateCategory(userId);
        finalCategoryId = defaultCategory.id;
    }

    return createTransactionWithBalanceUpdate(userId, {
        amount,
        type: finalType,
        categoryId: finalCategoryId,
    });
};

export const updateTransactionCategoryForUser = (
    transactionId,
    categoryId,
    userId,
) => {
    if (!categoryId) {
        const error = new Error("categoryId is required");
        error.statusCode = 400;
        throw error;
    }

    return updateTransactionCategory(transactionId, categoryId, userId);
};
