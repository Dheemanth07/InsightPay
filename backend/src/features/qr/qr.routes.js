import express from "express";
import {
    confirmQRPayment,
    generateQR,
    validateQR,
    markUsed,
    getStatus,
} from "./qr.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", authMiddleware, generateQR);
router.post("/validate", authMiddleware, validateQR);
router.post("/confirm", authMiddleware, confirmQRPayment);
router.post("/mark-used", authMiddleware, markUsed);
router.get("/status/:reference", authMiddleware, getStatus);

export default router;
