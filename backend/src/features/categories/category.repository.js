import prisma from "../../prisma.js";

export const findCategoryByNameForUser = (userId, name) => {
    return prisma.category.findFirst({
        where: { userId, name },
    });
};

export const createUserCategory = (data) => {
    return prisma.category.create({ data });
};

export const findCategoriesByUserId = (userId) => {
    return prisma.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
    });
};

export const deleteCategorySafely = (userId, categoryId) => {
    return prisma.$transaction(async (tx) => {
        const category = await tx.category.findFirst({
            where: { id: categoryId, userId },
        });

        if (!category) throw new Error("CATEGORY_NOT_FOUND");
        if (category.isDefault || category.isSystem) {
            throw new Error("CANNOT_DELETE_CATEGORY");
        }

        const defaultCategory = await tx.category.findFirst({
            where: { userId, isDefault: true },
        });

        if (!defaultCategory) throw new Error("SYSTEM_DEFAULT_MISSING");

        await tx.transaction.updateMany({
            where: { categoryId },
            data: { categoryId: defaultCategory.id },
        });

        await tx.category.delete({ where: { id: categoryId } });
    });
};

export const updateCategoryBudgetRepo = (userId, categoryId, monthlyBudget) => {
    return prisma.category.updateMany({
        where: { id: categoryId, userId },
        data: { monthlyBudget: monthlyBudget !== null ? monthlyBudget : null },
    });
};

export const findOrCreateDefaultCategoryRepo = async (userId) => {
    let category = await prisma.category.findFirst({
        where: { userId, isDefault: true },
    });

    if (!category) {
        category = await prisma.category.create({
            data: {
                userId,
                name: "Uncategorized",
                type: "EXPENSE",
                isDefault: true,
                isSystem: true,
            },
        });
    }
    return category;
};

export const seedDefaultCategoriesRepo = async (userId) => {
    const categories = [
        { name: "Uncategorized", type: "EXPENSE", isDefault: true, isSystem: true },
        { name: "Food", type: "EXPENSE", isSystem: true },
        { name: "Transport", type: "EXPENSE", isSystem: true },
        { name: "Shopping", type: "EXPENSE", isSystem: true },
        { name: "Bills", type: "EXPENSE", isSystem: true },
        { name: "Entertainment", type: "EXPENSE", isSystem: true },
        { name: "Travel", type: "EXPENSE", isSystem: true },
        { name: "People", type: "EXPENSE", isSystem: true },
    ];

    await prisma.category.createMany({
        data: categories.map((c) => ({
            ...c,
            userId,
        })),
        skipDuplicates: true,
    });
};

