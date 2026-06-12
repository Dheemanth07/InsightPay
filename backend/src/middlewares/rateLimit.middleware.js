import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: {
        message: "Too many attempts, please try again after 15 minutes."
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const insightsRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    // Allow 500 requests while coding locally, but restrict to 10 for real users
    max: process.env.NODE_ENV === "production" ? 10 : 500,
    message: {
        message: "You can only generate financial insights 10 times per hour. Please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => String(req.user?.id || "anonymous"),
});