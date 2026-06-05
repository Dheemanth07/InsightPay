export type Transaction = {
    id: number;
    amount: number;
    type: "DEPOSIT" | "TRANSFER" | "WITHDRAWAL";
    status: string;
    createdAt: string;
    fromUserId: number | null;
    toUserId: number | null;
    categoryId: string | null;
    fromUser?: {
        id: number;
        name: string;
    } | null;
    toUser?: {
        id: number;
        name: string;
    } | null;
    category?: {
        id: string;
        name: string;
        type: string;
    } | null;
};
