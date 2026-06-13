import {
    getUpcomingLiabilitiesForUser,
    generateFinancialInsights,
    addUserSubscription,
} from "./analytics.service.js";
import prisma from "../../prisma.js";
export const getUpcomingLiabilities = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await getUpcomingLiabilitiesForUser(userId);
        return res.status(200).json(result);
    } catch (err) {
        console.error("Error retrieving upcoming liabilities:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};
export const getFinancialInsights = async (req, res) => {
    try {
        const userId = req.user.id;
        const insight = await generateFinancialInsights(userId);
        return res.status(200).json({ insight });
    } catch (err) {
        console.error("Error generating financial insights:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};
export const createSubscription = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, amount, dueDate, cardId } = req.body;
        if (!name || !amount || !dueDate || !cardId) {
            return res.status(400).json({ message: "name, amount, dueDate, and cardId are required." });
        }
        const parsedAmount = parseFloat(amount);
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: "amount must be a positive number." });
        }
        const parsedDate = new Date(dueDate);
        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: "dueDate must be a valid ISO date string." });
        }
        // Verify the card belongs to this user
        const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
        if (!card) {
            return res.status(404).json({ message: "Card not found or does not belong to you." });
        }
        const subscription = await addUserSubscription(userId, { name, amount: parsedAmount, dueDate: parsedDate, cardId });
        return res.status(201).json(subscription);
    } catch (err) {
        console.error("Error creating subscription:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};

export const getDashboardAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;
        const now = new Date();

        // Cash Flow: last 6 months (start of month 5 months ago)
        const startDate6Months = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);

        const cashFlowTxs = await prisma.transaction.findMany({
            where: {
                status: "SUCCESS",
                createdAt: { gte: startDate6Months },
                OR: [
                    { fromUserId: userId },
                    { toUserId: userId }
                ]
            }
        });

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const cashFlowMap = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            cashFlowMap.push({
                month: monthNames[d.getMonth()],
                Income: 0,
                Expenses: 0,
                year: d.getFullYear(),
                monthIndex: d.getMonth()
            });
        }

        cashFlowTxs.forEach((tx) => {
            const date = new Date(tx.createdAt);
            const amount = Number(tx.amount) || 0;
            const monthName = monthNames[date.getMonth()];
            const year = date.getFullYear();

            const entry = cashFlowMap.find(item => item.month === monthName && item.year === year);
            if (entry) {
                if (tx.type === "DEPOSIT") {
                    entry.Income += amount;
                } else if (tx.type === "WITHDRAWAL") {
                    entry.Expenses += amount;
                } else if (tx.type === "TRANSFER") {
                    if (tx.fromUserId === userId) {
                        entry.Expenses += amount;
                    }
                    if (tx.toUserId === userId) {
                        entry.Income += amount;
                    }
                }
            }
        });

        const cashFlow = cashFlowMap.map(({ month, Income, Expenses }) => ({
            month,
            Income,
            Expenses
        }));

        // Categories: expenses (outgoing) from last 30 days
        const startDate30Days = new Date();
        startDate30Days.setDate(startDate30Days.getDate() - 30);
        startDate30Days.setHours(0, 0, 0, 0);

        const categoryTxs = await prisma.transaction.findMany({
            where: {
                status: "SUCCESS",
                createdAt: { gte: startDate30Days },
                fromUserId: userId,
                OR: [
                    { type: "TRANSFER" },
                    { type: "WITHDRAWAL" }
                ]
            },
            include: {
                category: true
            }
        });

        const categoryMap = {};
        categoryTxs.forEach((tx) => {
            const catName = tx.category ? tx.category.name : "Other";
            const amount = Number(tx.amount) || 0;
            categoryMap[catName] = (categoryMap[catName] || 0) + amount;
        });

        const categories = Object.keys(categoryMap).map(name => ({
            name,
            amount: categoryMap[name]
        }));

        return res.status(200).json({
            cashFlow,
            categories
        });
    } catch (err) {
        console.error("Error retrieving dashboard analytics:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};