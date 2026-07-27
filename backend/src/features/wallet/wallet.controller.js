import {
    addMoneyService,
    getTransactionHistoryService,
    sendMoneyService,
    withdrawMoneyService,
} from "./wallet.service.js";
import { verifyTxPin } from "../auth/auth.service.js";
import { createRazorpayOrder, verifyPaymentSignature } from "./razorpay.service.js";
import logger from "../../utils/logger.js";

const MAX_TX_AMOUNT = 100000; // ₹1,00,000 (1 Lakh)
const MAX_BALANCE = 1000000;  // ₹10,00,000 (10 Lakhs)

export const createOrder = async (req, res) => {
    try {
        const amount = Number(req.body.amount);
        if (!amount || amount <= 0 || amount > MAX_TX_AMOUNT) {
            return res.status(400).json({ message: "Invalid amount or exceeds ₹1,00,000 limit." });
        }
        const order = await createRazorpayOrder(req.user.id, amount);
        return res.status(200).json(order);
    } catch (err) {
        logger.error({ err }, "Create Razorpay Order Error");
        return res.status(500).json({ message: "Failed to initialize payment gateway order" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
        const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
            return res.status(400).json({ message: "Payment verification failed: Invalid cryptographic signature." });
        }
        const parsedAmount = Number(amount);
        const result = await addMoneyService(req.user.id, parsedAmount);
        return res.status(200).json({
            message: "Payment verified & money added successfully",
            balance: result.balance,
        });
    } catch (err) {
        logger.error({ err }, "Payment verification error");
        return res.status(500).json({ message: "Payment verification failed" });
    }
};

export const addMoney = async (req, res) => {
    try {
        const amount = Number(req.body.amount);

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount. Must be at least ₹1." });
        }

        if (amount > MAX_TX_AMOUNT) {
            return res.status(400).json({ message: `Transaction limit exceeded. Maximum amount per add is ₹${MAX_TX_AMOUNT.toLocaleString("en-IN")}.` });
        }

        const result = await addMoneyService(req.user.id, amount);

        if (Number(result.balance) > MAX_BALANCE) {
            // rollback
            return res.status(400).json({ message: `Wallet balance cap reached (Maximum ₹${MAX_BALANCE.toLocaleString("en-IN")}).` });
        }

        return res.status(200).json({
            message: "Money added successfully",
            balance: result.balance,
        });
    } catch (err) {
        logger.error({ err }, "Add money error");
        return res.status(500).json({ message: err.message || "Failed to add money" });
    }
};

export const sendMoney = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, pin } = req.body;
        const amount = Number(req.body.amount);

        await verifyTxPin(senderId, pin);

        if (!receiverId) {
            return res.status(400).json({ message: "Receiver not specified" });
        }

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount. Must be at least ₹1." });
        }

        if (amount > MAX_TX_AMOUNT) {
            return res.status(400).json({ message: `Transaction limit exceeded. Maximum transfer amount is ₹${MAX_TX_AMOUNT.toLocaleString("en-IN")}.` });
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
        logger.error({ err }, "Send money error");
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Failed to send money" });
    }
};

export const withdrawMoney = async (req, res) => {
    try {
        const amount = Number(req.body.amount);
        const { pin } = req.body;

        await verifyTxPin(req.user.id, pin);

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount. Must be at least ₹1." });
        }

        if (amount > MAX_TX_AMOUNT) {
            return res.status(400).json({ message: `Transaction limit exceeded. Maximum withdrawal amount is ₹${MAX_TX_AMOUNT.toLocaleString("en-IN")}.` });
        }

        const result = await withdrawMoneyService(req.user.id, amount);

        return res.status(200).json({
            message: "Money withdrawn successfully",
            balance: result.balance,
        });
    } catch (err) {
        logger.error({ err }, "Withdraw money error");
        return res
            .status(500)
            .json({ message: err.message || "Failed to withdraw money" });
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
        logger.error({ err }, "History API error");
        return res
            .status(500)
            .json({ message: "Failed to fetch transaction history" });
    }
};
