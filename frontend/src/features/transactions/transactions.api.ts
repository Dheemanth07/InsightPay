import { apiClient } from "../../shared/api/client";
import type { Transaction } from "./transactions.types";

export const getTransactions = () => {
    return apiClient.get<Transaction[]>("/transactions");
};

export const createTransaction = (data: {
    amount: number;
    type: string;
    categoryId: string;
}) => {
    return apiClient.post("/transactions", data);
};

export const updateTransactionCategory = (
    transactionId: number,
    categoryId: string,
) => {
    return apiClient.patch(`/transactions/${transactionId}/category`, {
        categoryId,
    });
};
