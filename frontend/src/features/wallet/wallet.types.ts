export type WalletTransaction = {
    id: number;
    amount: number | string;
    type: "DEPOSIT" | "TRANSFER" | "WITHDRAWAL";
    direction: "SEND" | "RECEIVE" | "WITHDRAWAL";
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
