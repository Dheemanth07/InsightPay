import { apiClient } from "../../shared/api/client";
import type {
    UpcomingLiabilitiesResponse,
    FinancialInsightsResponse,
    CreateSubscriptionPayload,
    Subscription,
    DashboardAnalyticsResponse,
} from "./dashboard.types";

export const getUpcomingLiabilities = () => {
    return apiClient.get<UpcomingLiabilitiesResponse>("/analytics/upcoming");
};
export const getFinancialInsights = () => {
    return apiClient.get<FinancialInsightsResponse>("/analytics/insights");
};
export const createSubscription = (payload: CreateSubscriptionPayload) => {
    return apiClient.post<Subscription>("/analytics/subscriptions", payload);
};
export const getDashboardAnalytics = () => {
    return apiClient.get<DashboardAnalyticsResponse>("/api/analytics");
};

// ─── New AI Insight APIs ──────────────────────────────────────────────────────

export const suggestCategory = (description: string, categories: string[]) => {
    return apiClient.post<{ suggestion: string | null }>("/analytics/suggest-category", {
        description,
        categories,
    });
};

export const getCategoryTrends = () => {
    return apiClient.get<{
        trends: Array<{
            category: string;
            direction: "up" | "down" | "flat" | "new";
            percent: number | null;
            label: string;
        }>;
    }>("/analytics/category-trends");
};

export const getSpendVelocity = () => {
    return apiClient.get<{
        velocity: {
            daysRemaining: number;
            dailyRate: number;
            message: string;
        } | null;
    }>("/analytics/spend-velocity");
};

export const getCashflowNarrative = (cashFlow: Array<{ month: string; Income: number; Expenses: number }>) => {
    return apiClient.post<{ narrative: string | null }>("/analytics/cashflow-narrative", { cashFlow });
};