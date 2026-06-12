import QRCode from "qrcode";
import crypto from "crypto";
import { signQR, verifyQR } from "../../utils/qrSignature.js";
import {
    confirmQrPaymentTransaction,
    createPendingQrTransaction,
    findQrTransactionByReference,
} from "./qr.repository.js";

const parseSignedQrData = (qrData) => {
    if (!qrData) {
        const error = new Error("QR data missing");
        error.statusCode = 400;
        throw error;
    }

    let parsed;
    try {
        parsed = JSON.parse(qrData);
    } catch {
        const error = new Error("Invalid QR data format");
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
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await createPendingQrTransaction({
        reference,
        amount,
        receiverId,
        expiresAt,
    });

    const payload = JSON.stringify({
        reference,
        expiresAt: expiresAt.getTime(),
    });
    const qrData = JSON.stringify({ payload, signature: signQR(payload) });
    const qrImage = await QRCode.toDataURL(qrData);

    return { qrData, qrImage, reference, expiresAt, amount };
};

export const validateQrPayment = async (qrData) => {
    const { reference } = parseSignedQrData(qrData);
    const transaction = await findQrTransactionByReference(reference);

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

export const confirmQrPayment = async (payerId, qrData) => {
    const { reference } = parseSignedQrData(qrData);
    const transaction = await confirmQrPaymentTransaction(payerId, reference);

    return {
        reference: transaction.reference,
        amount: transaction.amount,
    };
};
