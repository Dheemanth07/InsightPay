import { apiClient } from "../../shared/api/client";
import type { UpcomingLiabilitiesResponse, FinancialInsightsResponse } from "./dashboard.types";

export const getUpcomingLiabilities = () => {
    return apiClient.get<UpcomingLiabilitiesResponse>("/analytics/upcoming");
};

export const getFinancialInsights = () => {
    return apiClient.get<FinancialInsightsResponse>("/analytics/insights");
};
