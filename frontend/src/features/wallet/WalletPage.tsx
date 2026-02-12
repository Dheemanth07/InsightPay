import { useEffect, useState } from "react";
import api from "../../api/axios";

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
    const [error, setError] = useState<string>("");
    const [nextCursor, setNextCursor] = useState<number | null>(null);

    const [addAmount, setAddAmount] = useState<string>("");
    const [receiverId, setReceiverId] = useState<string>("");
    const [sendAmount, setSendAmount] = useState<string>("");

    const [processing, setProcessing] = useState(false);
    const [actionError, setActionError] = useState("");

    useEffect(() => {
        fetchWalletData();
    }, []);

    const fetchWalletData = async () => {
        try {
            setLoading(true);

            const userRes = await api.get("/auth/me");

            console.log("USER RES FULL:", userRes);
            console.log("USER RES DATA:", userRes.data);

            setBalance(Number(userRes.data.balance || 0));

            const txRes = await api.get("/wallet/transactions?limit=10");
            setTransactions(txRes.data.result?.transactions || []);
            setNextCursor(txRes.data.result?.nextCursor || null);
        } catch (err) {
            setError("Failed to load wallet data. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="wallet-loading">
                <h2>Loading wallet...</h2>
            </div>
        );
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    // 🔹 ADD MONEY
    const handleAddMoney = async () => {
        if (!addAmount || Number(addAmount) <= 0) return;

        setProcessing(true);
        setActionError("");

        try {
            const amount = Number(addAmount);

            // Optimistic update
            setBalance((prev) => prev + amount);

            await api.post("/wallet/add", { amount });

            setAddAmount("");
            await fetchWalletData(); // refresh to sync with server
        } catch (err: any) {
            setActionError("Failed to add money");
            fetchWalletData(); // revert optimistic state
        } finally {
            setProcessing(false);
        }
    };

    // 🔹 SEND MONEY
    const handleSendMoney = async () => {
        if (!receiverId || !sendAmount || Number(sendAmount) <= 0) return;

        setProcessing(true);
        setActionError("");

        try {
            const amount = Number(sendAmount);

            if (amount > balance) {
                setActionError("Insufficient balance");
                setProcessing(false);
                return;
            }

            // Optimistic update
            setBalance((prev) => prev - amount);

            await api.post("/wallet/send", {
                receiverId: Number(receiverId),
                amount,
            });

            setReceiverId("");
            setSendAmount("");
            await fetchWalletData();
        } catch (err: any) {
            setActionError(err.response?.data?.message || "Transfer failed");
            fetchWalletData(); // revert optimistic state
        } finally {
            setProcessing(false);
        }
    };

    // 🔹 LOAD MORE
    const loadMore = async () => {
        if (!nextCursor) return;

        try {
            const txRes = await api.get(
                `/wallet/transactions?limit=10&cursor=${nextCursor}`,
            );

            const newTx = txRes.data.result?.transactions || [];

            setTransactions((prev) => [...prev, ...newTx]);
            setNextCursor(txRes.data.result?.nextCursor || null);
        } catch {
            setActionError("Failed to load more transactions");
        }
    };

    return (
        <div className="wallet-page">
            <h1>Wallet</h1>

            {/* Balance */}
            <div className="balance-card">
                <h2>Current Balance</h2>
                <p>₹ {balance}</p>
            </div>

            {/* Action Errors */}
            {actionError && <p className="error-text">{actionError}</p>}

            {/* Add Money */}
            <div className="add-money">
                <h3>Add Money</h3>
                <input
                    type="number"
                    placeholder="Enter Amount"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                />
                <button onClick={handleAddMoney} disabled={processing}>
                    {processing ? "Processing..." : "Add Money"}
                </button>
            </div>

            {/* Send Money */}
            <div className="send-money">
                <h3>Send Money</h3>
                <input
                    type="number"
                    placeholder="Receiver ID"
                    value={receiverId}
                    onChange={(e) => setReceiverId(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                />
                <button onClick={handleSendMoney} disabled={processing}>
                    {processing ? "Processing..." : "Send"}
                </button>
            </div>

            {/* Transactions */}
            <div className="transactions">
                <h3>Recent Transactions</h3>

                {transactions.length === 0 ? (
                    <div className="empty-state">
                        <p>No transactions yet.</p>
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="transaction-row">
                            <span>
                                {tx.direction === "SEND" ? "Sent" : "Received"}
                            </span>
                            <span
                                style={{
                                    color:
                                        tx.direction === "SEND"
                                            ? "red"
                                            : "green",
                                }}
                            >
                                {tx.direction === "SEND" ? "-" : "+"}₹
                                {Math.abs(Number(tx.amount))}
                            </span>
                        </div>
                    ))
                )}

                {nextCursor && <button onClick={loadMore}>Load More</button>}
            </div>
        </div>
    );
}
