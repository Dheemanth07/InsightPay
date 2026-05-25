import prisma from "../prisma.js";

// Get or create default category for a user
export async function getOrCreateCategory(userId) {
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
}

// Seed default categories for a new user
export async function seedDefaultCategories(userId) {
    const categories = [
        {
            name: "Uncategorized",
            type: "EXPENSE",
            isDefault: true,
            isSystem: true,
        },
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
}
