import { AxiosError } from "axios";

type ErrorResponse = {
    message?: string;
};

export function getApiErrorMessage(error: unknown, fallback: string) {
    if (error instanceof AxiosError) {
        const response = error.response?.data as ErrorResponse | undefined;
        return response?.message || fallback;
    }

    return fallback;
}
