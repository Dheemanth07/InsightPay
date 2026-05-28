import {
    createTransactionForUser,
    getTransactionsForUser,
    updateTransactionCategoryForUser,
} from "./transaction.service.js";

export const getTransactions = async (req, res) => {
    try {
        const transactions = await getTransactionsForUser(req.user.id);

        return res.status(200).json(transactions);
    } catch (err) {
        console.error("Error fetching transactions:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const createTransaction = async (req, res) => {
    try {
        const transaction = await createTransactionForUser(req.user.id, req.body);

        return res.status(201).json(transaction);
    } catch (err) {
        console.error("Error creating transaction:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};

export const updateTransaction = async (req, res) => {
    try {
        const transaction = await updateTransactionCategoryForUser(
            req.params.id,
            req.body.categoryId,
        );

        return res.status(200).json(transaction);
    } catch (err) {
        console.error("Error updating transaction:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};
