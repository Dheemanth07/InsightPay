import express from "express";
import { getUpcomingLiabilities, getFinancialInsights } from "./analytics.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter, insightsRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/upcoming", authRateLimiter, authMiddleware, getUpcomingLiabilities);
router.get("/insights", insightsRateLimiter, authMiddleware, getFinancialInsights);

export default router;
