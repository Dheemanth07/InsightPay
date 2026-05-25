import { useEffect, useState } from "react";
import api from "axios";

interface Transaction {
    id: number;
    amount: number;
    direction: "SEND" | "RECEIVE";
    signedAmount: number;
    status: string;
    createdAt: string;
}

export default function Wallet() {
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            const userRes = await api.get("/auth/me");

            console.log("WALLET USER RES:", userRes.data);
            const userData = userRes.data.user ?? userRes.data;
            setBalance(Number(userData?.balance || 0));

            const txRes = await api.get("wallet/transactions?limit=10");
            setTransactions(txRes.data.result?.transactions || []);
        } catch (err) {
            console.error("Error fetching wallet data:", err);
        } finally {
            setLoading(false);
        }
    };
    if (loading) {
        return <div>Loading wallet data...</div>;
    }

    return (
        <div className="wallet-page">
            <h1>Wallet</h1>

            <div className="balance-card">
                <h2>Current Balance</h2>
                <p>₹ {balance}</p>
            </div>

            <div className="transactions">
                <h3>Recent Transactions</h3>

                {Array.isArray(transactions) &&
                    transactions.map((tx) => (
                        <div key={tx.id} className="transaction-row">
                            <span>
                                {tx.direction === "SEND" ? "Sent" : "Received"}
                            </span>
                            <span
                                className={`transaction-amount ${
                                    tx.direction === "SEND" ? "send" : "receive"
                                }`}
                            >
                                {tx.direction === "SEND" ? "-" : "+"}₹
                                {Math.abs(tx.amount)}
                            </span>
                        </div>
                    ))}
            </div>
        </div>
    );
}
