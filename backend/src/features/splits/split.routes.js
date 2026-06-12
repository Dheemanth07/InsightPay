import express from "express";
import {
    createSplit,
    settleSplit,
    rejectSplit,
    getIncomingPendingSplits,
    getOutgoingSplits,
} from "./split.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { authRateLimiter } from "../../middlewares/rateLimit.middleware.js";

const router = express.Router();

router.post("/", authRateLimiter, authMiddleware, createSplit);
router.get("/incoming", authRateLimiter, authMiddleware, getIncomingPendingSplits);
router.get("/outgoing", authRateLimiter, authMiddleware, getOutgoingSplits);
router.post("/:splitId/pay", authRateLimiter, authMiddleware, settleSplit);
router.post("/:splitId/reject", authRateLimiter, authMiddleware, rejectSplit);

export default router;
