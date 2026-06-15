import { apiClient } from "../../shared/api/client";
import type { LoginPayload, RegisterPayload, User } from "./auth.types";

export const registerUser = (data: RegisterPayload) => {
    return apiClient.post("/auth/register", data);
};

export const loginUser = (data: LoginPayload) => {
    return apiClient.post<{ user: User }>("/auth/login", data);
};

export const logoutUser = () => {
    return apiClient.post("/auth/logout");
};

export const getMe = () => {
    return apiClient.get<User>("/auth/me");
};
