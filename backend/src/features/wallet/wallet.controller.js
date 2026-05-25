import {
    addMoneyService,
    getTransactionHistoryService,
    sendMoneyService,
} from "./wallet.service.js";

export const addMoney = async (req, res) => {
    try {
        const amount = Number(req.body.amount);

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const result = await addMoneyService(req.user.id, amount);

        return res.status(200).json({
            message: "Money added successfully",
            balance: result.balance,
        });
    } catch (err) {
        console.error("Add money error:", err);
        return res.status(500).json({ message: "Failed to add money" });
    }
};

export const sendMoney = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId } = req.body;
        const amount = Number(req.body.amount);

        if (!receiverId) {
            return res.status(400).json({ message: "Receiver not specified" });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        if (senderId === Number(receiverId)) {
            return res
                .status(400)
                .json({ message: "Cannot send money to yourself" });
        }

        const result = await sendMoneyService(senderId, Number(receiverId), amount);

        return res.status(200).json({
            message: "Money sent successfully",
            balance: result.senderBalance,
        });
    } catch (err) {
        console.error("Send money error:", err);
        return res
            .status(500)
            .json({ message: err.message || "Failed to send money" });
    }
};

export const getTransactionHistory = async (req, res) => {
    try {
        const result = await getTransactionHistoryService(
            req.user.id,
            Number(req.query.limit) || 10,
            req.query.cursor ? Number(req.query.cursor) : null,
            req.query.type,
            req.query.from,
            req.query.to,
        );

        return res.status(200).json({
            message: "Transaction history fetched successfully",
            result,
        });
    } catch (err) {
        console.error("History API error:", err);
        return res
            .status(500)
            .json({ message: "Failed to fetch transaction history" });
    }
};
