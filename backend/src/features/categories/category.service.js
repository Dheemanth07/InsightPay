import {
    createUserCategory,
    deleteCategorySafely,
    findCategoriesByUserId,
    findCategoryByNameForUser,
} from "./category.repository.js";

export const createCategoryForUser = async (userId, { name, type }) => {
    if (!name || !name.trim()) {
        const error = new Error("Category name is required");
        error.statusCode = 400;
        throw error;
    }

    if (!type) {
        const error = new Error("Category type is required");
        error.statusCode = 400;
        throw error;
    }

    const normalizedName = name.trim();
    const existingCategory = await findCategoryByNameForUser(
        userId,
        normalizedName,
    );

    if (existingCategory) {
        const error = new Error("Category with this name already exists");
        error.statusCode = 400;
        throw error;
    }

    return createUserCategory({
        name: normalizedName,
        type,
        isDefault: false,
        isSystem: false,
        userId,
    });
};

export const getCategoriesForUser = (userId) => {
    return findCategoriesByUserId(userId);
};

export const deleteCategoryForUser = async (userId, categoryId) => {
    try {
        await deleteCategorySafely(userId, categoryId);
    } catch (err) {
        if (err.message === "CATEGORY_NOT_FOUND") {
            err.statusCode = 404;
            err.message = "Category not found";
        }

        if (err.message === "CANNOT_DELETE_CATEGORY") {
            err.statusCode = 400;
            err.message = "System or default categories cannot be deleted";
        }

        throw err;
    }
};
