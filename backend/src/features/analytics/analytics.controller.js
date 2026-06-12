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