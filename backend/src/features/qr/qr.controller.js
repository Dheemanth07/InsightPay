import {
    confirmQrPayment,
    generateQrForPayment,
    validateQrPayment,
} from "./qr.service.js";
import { markQrTransactionAsProcessed, getQrTransactionStatus } from "./qr.repository.js";

export const generateQR = async (req, res) => {
    try {
        const amount = Number(req.body.amount);

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const result = await generateQrForPayment(req.user.id, amount);

        return res.status(200).json(result);
    } catch (err) {
        console.error("Error generating QR code:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const validateQR = async (req, res) => {
    try {
        const result = await validateQrPayment(req.body.qrData);

        return res.status(200).json(result);
    } catch (err) {
        console.error("QR validation error:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "QR validation failed" });
    }
};

export const confirmQRPayment = async (req, res) => {
    try {
        const result = await confirmQrPayment(req.user.id, req.body.qrData);

        return res.status(200).json({
            message: "Payment successful",
            ...result,
        });
    } catch (err) {
        console.error("QR payment confirmation error:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Payment failed" });
    }
};

export const markUsed = async (req, res) => {
    try {
        const { reference } = req.body;

        if (!reference) {
            return res.status(400).json({ message: "Reference required" });
        }

        const result = await markQrTransactionAsProcessed(reference, req.user.id);

        return res.status(200).json({ message: "Marked used", result });
    } catch (err) {
        console.error("Error marking QR used:", err);
        return res.status(err.statusCode || 500).json({ message: err.message || "Internal server error" });
    }
};

export const getStatus = async (req, res) => {
    try {
        const { reference } = req.params;

        if (!reference) {
            return res.status(400).json({ message: "Reference required" });
        }

        const status = await getQrTransactionStatus(reference);

        return res.status(200).json(status);
    } catch (err) {
        console.error("Error fetching QR status:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
