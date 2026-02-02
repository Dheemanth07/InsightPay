import prisma from "../prisma.js";

// Create a new category
export async function createCategory(req, res) {
    try {
        const { name, type } = req.body;
        const userId = req.user.id;

        if (!name || !name.trim()) {
            return res
                .status(400)
                .json({ message: "Category name is required" });
        }

        if (!type) {
            return res
                .status(400)
                .json({ message: "Category type is required" });
        }

        const normalizedName = name.trim();

        const existingCategory = await prisma.category.findFirst({
            where: {
                userId,
                name: normalizedName,
            },
        });

        if (existingCategory) {
            return res.status(400).json({
                message: "Category with this name already exists",
            });
        }

        const category = await prisma.category.create({
            data: {
                name: normalizedName,
                type,
                isDefault: false,
                isSystem: false,
                userId,
            },
        });

        res.status(201).json(category);
    } catch (err) {
        console.error("Error creating category:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get all categories for the authenticated user
export async function getCategory(req, res) {
    try {
        const userId = req.user.id;

        const categories = await prisma.category.findMany({
            where: { userId },
            orderBy: { name: "asc" },
        });

        res.status(200).json(categories);
    } catch (err) {
        console.error("Error fetching categories:", err);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Delete a category by ID
export async function deleteCategory(req, res) {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        await prisma.$transaction(async (tx) => {
            const category = await tx.category.findFirst({
                where: { id, userId },
            });

            if (!category) {
                throw new Error("CATEGORY_NOT_FOUND");
            }

            if (category.isDefault || category.isSystem) {
                throw new Error("CANNOT_DELETE_CATEGORY");
            }

            const defaultCategory = await tx.category.findFirst({
                where: { userId, isDefault: true },
            });

            if (!defaultCategory) {
                throw new Error("SYSTEM_DEFAULT_MISSING");
            }

            await tx.transaction.updateMany({
                where: { categoryId: id },
                data: { categoryId: defaultCategory.id },
            });

            await tx.category.delete({
                where: { id },
            });
        });

        res.json({ message: "Category deleted safely" });
    } catch (err) {
        if (err.message === "CATEGORY_NOT_FOUND") {
            return res.status(404).json({ message: "Category not found" });
        }
        if (err.message === "CANNOT_DELETE_CATEGORY") {
            return res.status(400).json({
                message: "System or default categories cannot be deleted",
            });
        }

        res.status(500).json({ error: err.message });
    }
}
