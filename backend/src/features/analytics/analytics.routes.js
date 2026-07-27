import express from "express";
import {
    getUpcomingLiabilities,
    getFinancialInsights,
    createSubscription,
    getDashboardAnalytics,
    suggestCategory,
    getCategoryTrends,
    getSpendVelocity,
    getCashflowNarrative,
} from "./analytics.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter, insightsRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

// Existing routes
router.get("/", authRateLimiter, authMiddleware, getDashboardAnalytics);
router.get("/upcoming", authRateLimiter, authMiddleware, getUpcomingLiabilities);
router.get("/insights", insightsRateLimiter, authMiddleware, getFinancialInsights);
router.post("/subscriptions", authRateLimiter, authMiddleware, createSubscription);

// New AI insight routes
router.post("/suggest-category", insightsRateLimiter, authMiddleware, suggestCategory);
router.get("/category-trends", insightsRateLimiter, authMiddleware, getCategoryTrends);
router.get("/spend-velocity", insightsRateLimiter, authMiddleware, getSpendVelocity);
router.post("/cashflow-narrative", insightsRateLimiter, authMiddleware, getCashflowNarrative);

export default router;
