import type { Card } from "../cards/cards.types";

export type BillingCycle = "MONTHLY" | "YEARLY";

export type Subscription = {
    id: string;
    userId: number;
    cardId: string;
    merchantName: string;
    amount: string | number;
    billingCycle: BillingCycle;
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
