import express from "express";
import { getMe, login, register, getUsersSuggestions, getUsersSearchList } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.get("/me", authRateLimiter, authMiddleware, getMe);
router.get("/users/suggestions", authRateLimiter, authMiddleware, getUsersSuggestions);
router.get("/users/search", authRateLimiter, authMiddleware, getUsersSearchList);

export default router;
