import express from "express";
import { addCard, deleteCard, getCards, setPrimaryCardController } from "./card.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/add", authRateLimiter, authMiddleware, addCard);
router.get("/", authRateLimiter, authMiddleware, getCards);
router.patch("/:cardId/primary", authRateLimiter, authMiddleware, setPrimaryCardController);
router.delete("/:cardId", authRateLimiter, authMiddleware, deleteCard);

export default router;
