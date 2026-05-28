import { apiClient } from "../../shared/api/client";

export type Transaction = {
    id: number;
    amount: number;
    type: "DEPOSIT" | "TRANSFER" | "WITHDRAWAL";
    status: string;
    createdAt: string;
    fromUserId: number | null;
    toUserId: number | null;
    category?: {
        name: string;
        type: string;
    };
};

export const getTransactions = () => {
    return apiClient.get<Transaction[]>("/transactions");
};

export const createTransaction = (data: {
    amount: number;
    type: string;
    categoryId: number;
}) => {
    return apiClient.post("/transactions", data);
};

export const updateTransactionCategory = (
    transactionId: number,
    categoryId: number,
) => {
    return apiClient.patch(`/transactions/${transactionId}/category`, {
        categoryId,
    });
};
