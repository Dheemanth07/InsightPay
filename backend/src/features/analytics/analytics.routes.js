import express from "express";
import { getUpcomingLiabilities } from "./analytics.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/upcoming", authRateLimiter, authMiddleware, getUpcomingLiabilities);

export default router;
