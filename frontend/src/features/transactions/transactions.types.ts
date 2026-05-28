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
