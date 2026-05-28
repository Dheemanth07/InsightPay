import { apiClient } from "../../shared/api/client";

export type Category = {
    id: number;
    name: string;
    type: string;
    isSystem: boolean;
    createdAt: string;
};

export const getCategories = () => {
    return apiClient.get<Category[]>("/categories");
};

export const createCategory = (data: { name: string; type: string }) => {
    return apiClient.post("/categories", data);
};

export const deleteCategory = (categoryId: number) => {
    return apiClient.delete(`/categories/${categoryId}`);
};
