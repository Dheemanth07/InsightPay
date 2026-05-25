import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./features/auth/auth.routes.js";
import walletRoutes from "./features/wallet/wallet.routes.js";
import cardRoutes from "./features/cards/card.routes.js";
import qrRoutes from "./features/qr/qr.routes.js";
import transactionRoutes from "./features/transactions/transaction.routes.js";
import categoryRoutes from "./features/categories/category.routes.js";

const app = express();

app.disable("etag");

app.use(cors());
app.use(helmet());
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

export default app;
