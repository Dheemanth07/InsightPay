import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { doubleCsrf } from "csrf-csrf";

import authRoutes from "./features/auth/auth.routes.js";
import walletRoutes from "./features/wallet/wallet.routes.js";
import cardRoutes from "./features/cards/card.routes.js";
import qrRoutes from "./features/qr/qr.routes.js";
import transactionRoutes from "./features/transactions/transaction.routes.js";
import categoryRoutes from "./features/categories/category.routes.js";
import analyticsRoutes from "./features/analytics/analytics.routes.js";
import splitRoutes from "./features/splits/split.routes.js";

const app = express();

app.set("trust proxy", 1);
app.disable("etag");

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
  "https://insightpay.vercel.app",
  "https://insightpay.onrender.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      // Always allow local dev origins (localhost, 127.0.0.1, and LAN IPs like 192.168.x.x on any port)
      if (/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(cookieParser());

// express.json() MUST come before any request body parsing middleware
app.use(express.json());

// ── CSRF protection (double-submit cookie, session-less) ──────────────────────
const isProd = process.env.NODE_ENV === "production";

const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "insightpay-csrf-secret-fallback",
  // Simple alphanumeric name — __Host- prefix with dots caused csrf-csrf v3
  // to throw a ForbiddenError at initialization time on production
  cookieName: "insightpay-csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "strict",
    secure: isProd,
    path: "/",
  },
  size: 64,
  getTokenFromRequest: (req) => req.headers["x-csrf-token"],
});

// Expose CSRF token — GET is never CSRF-checked, safe to call before login
app.get("/csrf-token", (req, res) => {
  const token = generateToken(req, res);
  res.json({ token });
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to InsightPay Backend" });
});

// Apply CSRF protection to all state-mutating routes
app.use(doubleCsrfProtection);

app.use("/auth", authRoutes);
app.use("/wallet", walletRoutes);
app.use("/cards", cardRoutes);
app.use("/qr", qrRoutes);
app.use("/transactions", transactionRoutes);
app.use("/categories", categoryRoutes);
app.use("/analytics", analyticsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/splits", splitRoutes);

export default app;
