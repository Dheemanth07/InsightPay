import express from "express";
import { getMe, login, register, getUsersSuggestions, getUsersSearchList, logout } from "./auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter, sessionRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", authRateLimiter, register);
router.post("/login", authRateLimiter, login);
router.post("/logout", logout);
router.get("/me", sessionRateLimiter, authMiddleware, getMe);
router.get("/users/suggestions", sessionRateLimiter, authMiddleware, getUsersSuggestions);
router.get("/users/search", sessionRateLimiter, authMiddleware, getUsersSearchList);

export default router;
