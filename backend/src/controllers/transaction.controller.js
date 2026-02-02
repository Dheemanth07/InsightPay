import prisma from "../prisma.js";
import { getOrCreateCategory } from "../utils/category.js";

// Get all transactions for the logged-in user
export const getTransactions = async (req, res) => {
    try {
        const userId = req.user.id;

        const transactions = await prisma.transaction.findMany({
            where: {
                // Only show transactions where THIS user is the sender
                fromUserId: userId,
            },
            include: {
                // Also fetch the category details (name, icon, etc.)
                category: {
                    select: { name: true, type: true },
                },
            },
            orderBy: {
                // Show newest transactions at the top
                createdAt: "desc",
            },
        });

        res.status(200).json(transactions);
    } catch (err) {
        console.error("Error fetching transactions:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createTransaction = async (req, res) => {
    try {
        const { amount, type, categoryId } = req.body;
        const userId = req.user.id;

        // 1. Logic to find the default category remains the same
        let finalCategoryId = categoryId;
        if (!finalCategoryId) {
            const defaultCategory = await getOrCreateCategory(userId);
            finalCategoryId = defaultCategory.id;
        }

        // Instead of just creating the transaction, we open a database transaction
        const result = await prisma.$transaction(async (tx) => {
            // Step A: Create the Transaction Record
            const newTxn = await tx.transaction.create({
                data: {
                    amount,
                    type,
                    status: "SUCCESS",
                    fromUser: {
                        connect: { id: userId },
                    },
                    category: {
                        connect: { id: finalCategoryId },
                    },
                },
            });

            // Step B: Update the User's Balance
            // We check the type to decide if we add or subtract money
            if (type === "SEND") {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        balance: { decrement: amount }, // Subtracts money
                    },
                });
            } else if (type === "ADD" || type === "RECEIVE") {
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        balance: { increment: amount }, // Adds money
                    },
                });
            }

            return newTxn;
        });

        res.status(201).json(result);
    } catch (err) {
        console.error("Error creating transaction:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ... updateTransaction remains below

export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { categoryId } = req.body;

        if (!categoryId) {
            return res.status(400).json({ message: "categoryId is required" });
        }

        const transaction = await prisma.transaction.update({
            where: { id: Number(id) },
            data: { category: { connect: { id: categoryId } } },
        });
        res.status(200).json(transaction);
    } catch (err) {
        console.error("Error updating transaction:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
