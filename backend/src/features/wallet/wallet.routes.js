import express from "express";
import {
    addMoney,
    getTransactionHistory,
    sendMoney,
    withdrawMoney,
} from "./wallet.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/add", authRateLimiter, authMiddleware, addMoney);
router.post("/send", authRateLimiter, authMiddleware, sendMoney);
router.post("/withdraw", authRateLimiter, authMiddleware, withdrawMoney);
router.get("/transactions", authRateLimiter, authMiddleware, getTransactionHistory);

export default router;
