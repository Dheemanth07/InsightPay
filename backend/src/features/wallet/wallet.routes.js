import express from "express";
import {
    addMoney,
    getTransactionHistory,
    sendMoney,
    withdrawMoney,
} from "./wallet.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addMoney);
router.post("/send", authMiddleware, sendMoney);
router.post("/withdraw", authMiddleware, withdrawMoney);
router.get("/transactions", authMiddleware, getTransactionHistory);

export default router;
