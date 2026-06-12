import axios from "axios";

const DEFAULT_API_HOST = (() => {
    if (
        typeof window !== "undefined" &&
        window.location &&
        window.location.hostname
    ) {
        return `http://${window.location.hostname}:8000`;
    }
    return "http://localhost:8000";
})();

export const apiClient = axios.create({
    baseURL: DEFAULT_API_HOST,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});
