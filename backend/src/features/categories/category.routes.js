import express from "express";
import {
    createCategory,
    deleteCategory,
    getCategory,
} from "./category.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/", authRateLimiter, authMiddleware, createCategory);
router.get("/", authRateLimiter, authMiddleware, getCategory);
router.delete("/:id", authRateLimiter, authMiddleware, deleteCategory);

export default router;
