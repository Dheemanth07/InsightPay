import { apiClient } from "../../shared/api/client";
import type { User } from "../auth/auth.types";
import type { WalletHistoryResponse } from "./wallet.types";

export const getWalletOwner = () => {
    return apiClient.get<User>("/auth/me");
};

export const getWalletTransactions = (cursor?: number | null) => {
    const params = new URLSearchParams({ limit: "10" });

    if (cursor) {
        params.set("cursor", String(cursor));
    }

    return apiClient.get<WalletHistoryResponse>(
        `/wallet/transactions?${params.toString()}`,
    );
};

export const addMoney = (amount: number) => {
    return apiClient.post("/wallet/add", { amount });
};

export const sendMoney = (receiverId: number, amount: number) => {
    return apiClient.post("/wallet/send", { receiverId, amount });
};
