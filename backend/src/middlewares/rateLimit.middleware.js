// 1. Import the ipKeyGenerator helper
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
        message: "Too many attempts, please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const sessionRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    // 2. Update the keyGenerator to use the helper safely
    keyGenerator: (req, res) => {
        if (req.user?.id) {
            return String(req.user.id);
        }
        return ipKeyGenerator(req, res);
    }
});

export const insightsRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: process.env.NODE_ENV === "production" ? 10 : 500,
    message: {
        message: "You can only generate financial insights 10 times per hour. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user?.id || "anonymous"),
});