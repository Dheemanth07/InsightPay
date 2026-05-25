import { getOrCreateCategory } from "../../utils/category.js";
import {
    createTransactionWithBalanceUpdate,
    findTransactionsForUser,
    updateTransactionCategory,
} from "./transaction.repository.js";

export const getTransactionsForUser = (userId) => {
    return findTransactionsForUser(userId);
};

export const createTransactionForUser = async (
    userId,
    { amount, type, categoryId },
) => {
    let finalCategoryId = categoryId;

    if (!finalCategoryId) {
        const defaultCategory = await getOrCreateCategory(userId);
        finalCategoryId = defaultCategory.id;
    }

    return createTransactionWithBalanceUpdate(userId, {
        amount,
        type,
        categoryId: finalCategoryId,
    });
};

export const updateTransactionCategoryForUser = (transactionId, categoryId) => {
    if (!categoryId) {
        const error = new Error("categoryId is required");
        error.statusCode = 400;
        throw error;
    }

    return updateTransactionCategory(transactionId, categoryId);
};
