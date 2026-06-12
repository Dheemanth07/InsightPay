import { apiClient } from "../../shared/api/client";
import type { Transaction } from "./transactions.types";

export type SplitStatus = "PENDING" | "PAID" | "REJECTED";

export type SplitRequest = {
    id: string;
    transactionId: number;
    requesterId: number;
    payerId: number;
    amountOwed: string | number;
    status: SplitStatus;
    createdAt: string;
    updatedAt: string;
    transaction: Transaction;
    requester?: { id: number; name: string; email: string };
    payer?: { id: number; name: string; email: string };
};

export type SplitUser = {
    id: number;
    name: string;
    email: string;
};

export const initiateSplit = (data: {
    transactionId: number;
    splits: Array<{ payerId: number; amountOwed: number }>;
}) => {
    return apiClient.post<{ message: string }>("/splits", data);
};

export const getIncomingPendingSplits = () => {
    return apiClient.get<{ splits: SplitRequest[] }>("/splits/incoming");
};

export const getOutgoingSplits = () => {
    return apiClient.get<{ splits: SplitRequest[] }>("/splits/outgoing");
};

export const paySplitShare = (splitId: string) => {
    return apiClient.post<{ message: string }>(`/splits/${splitId}/pay`);
};

export const rejectSplitShare = (splitId: string) => {
    return apiClient.post<{ message: string }>(`/splits/${splitId}/reject`);
};

export const getUsersSuggestions = () => {
    return apiClient.get<{ users: SplitUser[] }>("/auth/users/suggestions");
};

export const searchUsers = (query: string) => {
    return apiClient.get<{ users: SplitUser[] }>(`/auth/users/search?q=${encodeURIComponent(query)}`);
};
