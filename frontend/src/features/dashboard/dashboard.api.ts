import { apiClient } from "../../shared/api/client";
import type { UpcomingLiabilitiesResponse } from "./dashboard.types";

export const getUpcomingLiabilities = () => {
    return apiClient.get<UpcomingLiabilitiesResponse>("/analytics/upcoming");
};
