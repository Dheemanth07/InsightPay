import express from "express";
import { addCard, deleteCard, getCards } from "./card.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/add", authMiddleware, addCard);
router.get("/", authMiddleware, getCards);
router.delete("/:cardId", authMiddleware, deleteCard);

export default router;
