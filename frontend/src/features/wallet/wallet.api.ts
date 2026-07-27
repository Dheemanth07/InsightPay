import { apiClient } from "../../shared/api/client";
import type { User } from "../auth/auth.types";
import type { WalletHistoryResponse } from "./wallet.types";

export const getWalletOwner = () => {
    return apiClient.get<User & { upiId?: string; hasTxPin?: boolean }>("/auth/me");
};

export const getWalletTransactions = (
    cursor?: number | null,
    limit = 10,
) => {
    const params = new URLSearchParams({ limit: String(limit) });

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

export const createRazorpayOrder = (amount: number) => {
    return apiClient.post<{ id: string; amount: number; currency: string; keyId: string }>("/wallet/create-order", { amount });
};

export const verifyRazorpayPayment = (payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    amount: number;
}) => {
    return apiClient.post<{ message: string; balance: number }>("/wallet/verify-payment", payload);
};

export const setupTxPin = (pin: string) => {
    return apiClient.post<{ message: string; upiId: string }>("/auth/pin", { pin });
};

export const sendMoney = (receiverId: number, amount: number, pin: string) => {
    return apiClient.post("/wallet/send", { receiverId, amount, pin });
};

export const withdrawMoney = (amount: number, pin: string) => {
    return apiClient.post("/wallet/withdraw", { amount, pin });
};
