import express from "express";
import {
    createTransaction,
    getTransactions,
    updateTransaction,
} from "./transaction.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.get("/", authRateLimiter, authMiddleware, getTransactions);
router.post("/", authRateLimiter, authMiddleware, createTransaction);
router.patch("/:id/category", authRateLimiter, authMiddleware, updateTransaction);

export default router;
