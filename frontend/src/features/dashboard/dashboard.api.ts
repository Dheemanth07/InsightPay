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