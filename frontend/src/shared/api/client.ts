import axios from "axios";

const DEFAULT_API_HOST = import.meta.env.VITE_API_URL || (() => {
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
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use((config) => {
    return config;
});
