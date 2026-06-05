import express from "express";
import { addCard, deleteCard, getCards } from "./card.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/add", authRateLimiter, authMiddleware, addCard);
router.get("/", authRateLimiter, authMiddleware, getCards);
router.delete("/:cardId", authRateLimiter, authMiddleware, deleteCard);

export default router;
