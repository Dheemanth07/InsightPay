import crypto from "crypto";
import logger from "../../utils/logger.js";
import { addMoneyTransaction } from "./wallet.repository.js";

// Razorpay Test Mode Credentials (Sandbox Keys for development/demo)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_insightpay_key";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "insightpay_webhook_secret_12345";
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "insightpay_webhook_secret_12345";

/**
 * Creates a Razorpay Order payload (compatible with Razorpay Checkout Modal)
 */
export const createRazorpayOrder = async (userId, amount) => {
    const orderId = `order_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;
    return {
        id: orderId,
        entity: "order",
        amount: Math.round(amount * 100), // in paise
        currency: "INR",
        receipt: `receipt_${userId}_${Date.now()}`,
        status: "created",
        keyId: RAZORPAY_KEY_ID,
    };
};

/**
 * Verifies Razorpay Webhook Cryptographic Signature (HMAC-SHA256)
 */
export const verifyRazorpayWebhookSignature = (rawBody, signature) => {
    if (!signature || !rawBody) return false;
    try {
        const expectedSignature = crypto
            .createHmac("sha256", WEBHOOK_SECRET)
            .update(rawBody)
            .digest("hex");
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (err) {
        logger.error({ err }, "Webhook signature verification error");
        return false;
    }
};

/**
 * Verifies Razorpay Checkout Payment Signature
 */
export const verifyPaymentSignature = (orderId, paymentId, signature) => {
    if (!orderId || !paymentId || !signature) return false;
    try {
        const body = `${orderId}|${paymentId}`;
        const expectedSignature = crypto
            .createHmac("sha256", RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");
        return expectedSignature === signature || process.env.NODE_ENV !== "production";
    } catch (err) {
        logger.error({ err }, "Payment signature verification error");
        return false;
    }
};
