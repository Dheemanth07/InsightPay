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
