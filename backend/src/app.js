import express from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import cardRoutes from "./routes/card.routes.js";
import qrRoutes from "./routes/qr.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import categoryRoutes from "./routes/category.routes.js";

const app = express();

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
