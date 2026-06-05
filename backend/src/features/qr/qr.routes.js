import express from "express";
import {
    confirmQRPayment,
    generateQR,
    validateQR,
    markUsed,
    getStatus,
} from "./qr.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/generate", authRateLimiter, authMiddleware, generateQR);
router.post("/validate", authRateLimiter, authMiddleware, validateQR);
router.post("/confirm", authRateLimiter, authMiddleware, confirmQRPayment);
router.post("/mark-used", authRateLimiter, authMiddleware, markUsed);
router.get("/status/:reference", authRateLimiter, authMiddleware, getStatus);

export default router;
