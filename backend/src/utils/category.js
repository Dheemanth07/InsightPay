import {
    findOrCreateDefaultCategoryRepo,
    seedDefaultCategoriesRepo,
} from "../features/categories/category.repository.js";

// Get or create default category for a user
export async function getOrCreateCategory(userId) {
    return findOrCreateDefaultCategoryRepo(userId);
}

// Seed default categories for a new user
export async function seedDefaultCategories(userId) {
    return seedDefaultCategoriesRepo(userId);
}

