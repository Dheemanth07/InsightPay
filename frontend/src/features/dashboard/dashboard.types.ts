import type { Card } from "../cards/cards.types";
export type BillingCycle = "MONTHLY" | "YEARLY";
export type Subscription = {
    id: string;
    userId: number;
    cardId: string;
    name: string;
    merchantName: string;
    amount: string | number;
    billingCycle: BillingCycle;
    dueDate: string;
    nextBillingDate: string;
    createdAt: string;
    updatedAt: string;
    card: Card;
};
export type UpcomingLiabilitiesResponse = {
    upcomingLiabilities: Subscription[];
    totalAmount: number;
};
export type FinancialInsightsResponse = {
    insight: string;
};
export type CreateSubscriptionPayload = {
    name: string;
    amount: number;
    dueDate: string; // ISO date string
    cardId: string;
};

export type CashFlowData = {
    month: string;
    Income: number;
    Expenses: number;
};

export type CategoryData = {
    name: string;
    amount: number;
};

export type DashboardAnalyticsResponse = {
    cashFlow: CashFlowData[];
    categories: CategoryData[];
};

