import QRCode from "qrcode";
import crypto from "crypto";
import prisma from "../../prisma.js";
import { signQR, verifyQR } from "../../utils/qrSignature.js";
import {
    confirmQrPaymentTransaction,
    createPendingQrTransaction,
    findQrTransactionByReference,
} from "./qr.repository.js";
import { verifyTxPin } from "../auth/auth.service.js";

const parseUniversalUpiQr = (qrData) => {
    if (typeof qrData !== "string") return null;
    const trimmed = qrData.trim();
    if (trimmed.startsWith("upi://pay")) {
        try {
            const url = new URL(trimmed);
            const pa = url.searchParams.get("pa") || "";
            const pn = url.searchParams.get("pn") || "Merchant";
            const am = parseFloat(url.searchParams.get("am") || "0");
            const tn = url.searchParams.get("tn") || "";

            // Extract embedded reference from tn parameter if present (e.g. "InsightPay Payment (qr_12345)")
            const refMatch = tn.match(/qr_[a-f0-9-]+/i);
            const reference = refMatch ? refMatch[0] : null;

            return { isUniversalUpi: true, upiId: pa, payeeName: pn, amount: am, reference };
        } catch {
            return null;
        }
    }
    return null;
};

const parseSignedQrData = (qrData) => {
    if (!qrData) {
        const error = new Error("QR data missing");
        error.statusCode = 400;
        throw error;
    }

    const universal = parseUniversalUpiQr(qrData);
    if (universal) return universal;

    let parsed;
    try {
        parsed = JSON.parse(qrData);
    } catch {
        const error = new Error("Invalid QR data format. Must be a valid InsightPay QR or standard UPI QR.");
        error.statusCode = 400;
        throw error;
    }

    const { payload, signature } = parsed;
    if (!payload || !signature) {
        const error = new Error("QR payload or signature missing");
        error.statusCode = 400;
        throw error;
    }

    if (!verifyQR(payload, signature)) {
        const error = new Error("QR tampered or invalid");
        error.statusCode = 400;
        throw error;
    }

    const data = JSON.parse(payload);
    if (Date.now() > data.expiresAt) {
        const error = new Error("QR code expired");
        error.statusCode = 400;
        throw error;
    }

    return data;
};

export const generateQrForPayment = async (receiverId, amount) => {
    const reference = `qr_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    const user = await prisma.user.findUnique({ where: { id: receiverId }, select: { name: true, upiId: true, email: true } });
    const upiId = user?.upiId || `${user?.email ? user.email.split("@")[0] : "user"}@insightpay`;

    // Generate Universal NPCI compliant UPI URI (Standard for GPay / PhonePe / Paytm / Navi)
    const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(user?.name || "InsightPay User")}&am=${amount}&cu=INR&tn=${encodeURIComponent(`InsightPay Payment (${reference})`)}`;

    const payload = JSON.stringify({
        reference,
        expiresAt: expiresAt.getTime(),
        upiUri,
    });
    const qrData = JSON.stringify({ payload, signature: signQR(payload) });

    // Generate QR Image encoding standard upiUri so GPay, Navi, PhonePe, Paytm & internal scanner all scan it natively
    const qrImage = await QRCode.toDataURL(upiUri);

    await createPendingQrTransaction({
        reference,
        amount,
        receiverId,
        expiresAt,
    });

    return { qrData, qrImage, upiUri, reference, expiresAt, amount, payeeName: user?.name, upiId };
};

export const validateQrPayment = async (qrData) => {
    const parsed = parseSignedQrData(qrData);

    if (parsed.isUniversalUpi) {
        if (parsed.reference) {
            const transaction = await findQrTransactionByReference(parsed.reference);
            if (transaction) {
                if (transaction.status !== "PENDING") {
                    const error = new Error("QR already used or Transaction already processed");
                    error.statusCode = 400;
                    throw error;
                }
                return {
                    reference: transaction.reference,
                    amount: transaction.amount,
                    receiverId: transaction.toUserId,
                    expiresAt: transaction.qrExpiresAt,
                    payeeName: transaction.toUser?.name,
                };
            }
        }

        let user = null;
        if (parsed.upiId) {
            user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { upiId: parsed.upiId },
                        { email: parsed.upiId.split("@")[0] + "@gmail.com" },
                    ],
                },
            });
        }

        return {
            isUniversalUpi: true,
            upiId: parsed.upiId,
            payeeName: user?.name || parsed.payeeName,
            receiverId: user?.id || null,
            amount: parsed.amount,
        };
    }

    const transaction = await findQrTransactionByReference(parsed.reference);

    if (!transaction) {
        const error = new Error("Transaction not found");
        error.statusCode = 404;
        throw error;
    }

    if (transaction.status !== "PENDING") {
        const error = new Error("QR already used or Transaction already processed");
        error.statusCode = 400;
        throw error;
    }

    return {
        reference: transaction.reference,
        amount: transaction.amount,
        receiverId: transaction.toUserId,
        expiresAt: transaction.qrExpiresAt,
    };
};

export const confirmQrPayment = async (payerId, qrData, pin) => {
    if (pin) {
        await verifyTxPin(payerId, pin);
    }
    const parsed = parseSignedQrData(qrData);

    let reference = parsed.reference;

    if (parsed.isUniversalUpi && !reference) {
        let receiverId = parsed.receiverId;
        if (!receiverId && parsed.upiId) {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { upiId: parsed.upiId },
                        { email: parsed.upiId.split("@")[0] + "@gmail.com" },
                    ],
                },
            });
            if (!user) throw new Error("Payee user not found for UPI ID");
            receiverId = user.id;
        }

        if (receiverId) {
            const transaction = await confirmQrPaymentTransaction(payerId, reference);
            return { reference: transaction.reference, amount: transaction.amount };
        }
    }

    if (!reference) {
        const error = new Error("Invalid transaction reference");
        error.statusCode = 400;
        throw error;
    }

    const transaction = await confirmQrPaymentTransaction(payerId, reference);

    return {
        reference: transaction.reference,
        amount: transaction.amount,
    };
};
