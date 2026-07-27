export type Category = {
    id: string;
    name: string;
    type: string;
    monthlyBudget?: number | null;
    isSystem: boolean;
    createdAt: string;
};
