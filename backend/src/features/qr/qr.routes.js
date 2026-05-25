import express from "express";
import {
    confirmQRPayment,
    generateQR,
    validateQR,
} from "./qr.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/generate", authMiddleware, generateQR);
router.post("/validate", authMiddleware, validateQR);
router.post("/confirm", authMiddleware, confirmQRPayment);

export default router;
