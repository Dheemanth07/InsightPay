import {
    createCategoryForUser,
    deleteCategoryForUser,
    getCategoriesForUser,
} from "./category.service.js";

export const createCategory = async (req, res) => {
    try {
        const category = await createCategoryForUser(req.user.id, req.body);

        return res.status(201).json(category);
    } catch (err) {
        console.error("Error creating category:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};

export const getCategory = async (req, res) => {
    try {
        const categories = await getCategoriesForUser(req.user.id);

        return res.status(200).json(categories);
    } catch (err) {
        console.error("Error fetching categories:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteCategory = async (req, res) => {
    try {
        await deleteCategoryForUser(req.user.id, req.params.id);

        return res.json({ message: "Category deleted safely" });
    } catch (err) {
        console.error("Error deleting category:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};
