import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import lusca from "lusca";
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
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(cookieParser());

// express.json() MUST come before lusca so req.body is available for CSRF token check
app.use(express.json());

// CSRF protection — uses header-based token for cross-origin SPA compatibility
app.use(
  lusca.csrf({
    secret: process.env.CSRF_SECRET || "dev-csrf-secret-change-me",
    cookie: {
      key: "XSRF-TOKEN",
      httpOnly: false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
    // Accept token from X-CSRF-Token header (frontend can't read cross-origin cookies)
    value: (req) => req.headers["x-csrf-token"] || req.body?._csrf,
  })
);

// Expose CSRF token in response body so cross-origin SPA can read it
// GET requests are never CSRF-checked, so this is safe to place after the middleware
app.get("/csrf-token", (req, res) => {
  res.json({ token: res.locals._csrf || "" });
});

app.get("/", (req, res) => {
  res.json({ message: "Welcome to InsightPay Backend" });
});

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
