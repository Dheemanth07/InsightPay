import express from "express";
import {
    getUpcomingLiabilities,
    getFinancialInsights,
    createSubscription,
    getDashboardAnalytics,
} from "./analytics.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter, insightsRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/", authRateLimiter, authMiddleware, getDashboardAnalytics);
router.get("/upcoming", authRateLimiter, authMiddleware, getUpcomingLiabilities);
router.get("/insights", insightsRateLimiter, authMiddleware, getFinancialInsights);
router.post("/subscriptions", authRateLimiter, authMiddleware, createSubscription);

export default router;
