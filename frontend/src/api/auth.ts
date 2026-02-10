import api from "./axios";

export interface UserData {
    name: string;
    email: string;
    password: string;
}

export const registerUser = (data: UserData) =>
    api.post("/auth/register", data);

export const loginUser = (data: Omit<UserData, "name">) =>
    api.post("/auth/login", data);

export const getMe = () => api.get("/auth/me");
