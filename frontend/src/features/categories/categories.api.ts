import { apiClient } from "../../shared/api/client";
import type { Category } from "./categories.types";

export const getCategories = () => {
    return apiClient.get<Category[]>("/categories");
};

export const createCategory = (data: { name: string; type: string }) => {
    return apiClient.post("/categories", data);
};

export const deleteCategory = (categoryId: string) => {
    return apiClient.delete(`/categories/${categoryId}`);
};
