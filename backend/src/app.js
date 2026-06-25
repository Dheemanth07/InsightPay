import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./features/auth/auth.routes.js";
import walletRoutes from "./features/wallet/wallet.routes.js";
import cardRoutes from "./features/cards/card.routes.js";
import qrRoutes from "./features/qr/qr.routes.js";
import transactionRoutes from "./features/transactions/transaction.routes.js";
import categoryRoutes from "./features/categories/category.routes.js";
import analyticsRoutes from "./features/analytics/analytics.routes.js";
import splitRoutes from "./features/splits/split.routes.js";


const app = express();

// Trust reverse proxy (Render, Vercel) for rate limiting X-Forwarded-For headers
app.set("trust proxy", 1);

app.disable("etag");

const allowedOrigins = [
    process.env.FRONTEND_URL,             // Vercel Production Domain
    "http://localhost:5173",              // Local Development
];

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps or curl requests)
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

app.use(express.json());

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
