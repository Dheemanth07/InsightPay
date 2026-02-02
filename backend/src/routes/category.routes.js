import express from "express";
import {
    createCategory,
    getCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authMiddleware, createCategory);
router.get("/", authMiddleware, getCategory);
router.delete("/:id", authMiddleware, deleteCategory);

export default router;
