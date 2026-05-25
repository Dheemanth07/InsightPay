import express from "express";
import {
    createTransaction,
    getTransactions,
    updateTransaction,
} from "./transaction.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getTransactions);
router.post("/", authMiddleware, createTransaction);
router.patch("/:id/category", authMiddleware, updateTransaction);

export default router;
