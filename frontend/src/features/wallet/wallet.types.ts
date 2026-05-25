export type WalletTransaction = {
    id: number;
    amount: number | string;
    direction: "SEND" | "RECEIVE";
    signedAmount: number;
    status: string;
    createdAt: string;
};

export type WalletHistoryResponse = {
    result?: {
        transactions?: WalletTransaction[];
        nextCursor?: number | null;
    };
};
