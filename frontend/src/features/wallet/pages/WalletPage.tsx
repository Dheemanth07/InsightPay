import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import {
    addMoney,
    getWalletOwner,
    getWalletTransactions,
    sendMoney,
} from "../wallet.api";
import type { WalletTransaction } from "../wallet.types";

export function WalletPage() {
    const [balance, setBalance] = useState<number>(0);
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [nextCursor, setNextCursor] = useState<number | null>(null);
    const [addAmount, setAddAmount] = useState("");
    const [receiverId, setReceiverId] = useState("");
    const [sendAmount, setSendAmount] = useState("");
    const [processing, setProcessing] = useState(false);
    const [actionError, setActionError] = useState("");

    const fetchWalletData = useCallback(async () => {
        try {
            setLoading(true);
            const [userResponse, transactionResponse] = await Promise.all([
                getWalletOwner(),
                getWalletTransactions(),
            ]);

            setBalance(Number(userResponse.data.balance || 0));
            setTransactions(
                transactionResponse.data.result?.transactions || [],
            );
            setNextCursor(transactionResponse.data.result?.nextCursor || null);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Failed to load wallet data. Please try again later.",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWalletData();
    }, [fetchWalletData]);

    const handleAddMoney = async () => {
        const amount = Number(addAmount);
        if (!amount || amount <= 0) return;

        setProcessing(true);
        setActionError("");

        try {
            setBalance((currentBalance) => currentBalance + amount);
            await addMoney(amount);
            setAddAmount("");
            await fetchWalletData();
        } catch (err) {
            setActionError(getApiErrorMessage(err, "Failed to add money"));
            await fetchWalletData();
        } finally {
            setProcessing(false);
        }
    };

    const handleSendMoney = async () => {
        const amount = Number(sendAmount);
        const receiver = Number(receiverId);

        if (!receiver || !amount || amount <= 0) return;

        if (amount > balance) {
            setActionError("Insufficient balance");
            return;
        }

        setProcessing(true);
        setActionError("");

        try {
            setBalance((currentBalance) => currentBalance - amount);
            await sendMoney(receiver, amount);
            setReceiverId("");
            setSendAmount("");
            await fetchWalletData();
        } catch (err) {
            setActionError(getApiErrorMessage(err, "Transfer failed"));
            await fetchWalletData();
        } finally {
            setProcessing(false);
        }
    };

    const loadMore = async () => {
        if (!nextCursor) return;

        try {
            const response = await getWalletTransactions(nextCursor);
            const nextTransactions = response.data.result?.transactions || [];

            setTransactions((currentTransactions) => [
                ...currentTransactions,
                ...nextTransactions,
            ]);
            setNextCursor(response.data.result?.nextCursor || null);
        } catch (err) {
            setActionError(
                getApiErrorMessage(err, "Failed to load more transactions"),
            );
        }
    };

    if (loading) {
        return <p className="page-status">Loading wallet...</p>;
    }

    if (error) {
        return <p className="page-status error-text">{error}</p>;
    }

    return (
        <main className="app-page wallet-page">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Wallet</p>
                    <h1>Balance and Transfers</h1>
                </div>
            </header>

            <section className="panel balance-panel">
                <p>Current Balance</p>
                <h2>INR {balance.toFixed(2)}</h2>
            </section>

            {actionError && <p className="error-text">{actionError}</p>}

            <section className="wallet-actions">
                <div className="panel">
                    <h2>Add Money</h2>
                    <label>
                        Amount
                        <input
                            type="number"
                            min="1"
                            value={addAmount}
                            onChange={(event) =>
                                setAddAmount(event.target.value)
                            }
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleAddMoney}
                        disabled={processing}
                    >
                        {processing ? "Processing..." : "Add Money"}
                    </button>
                </div>

                <div className="panel">
                    <h2>Send Money</h2>
                    <label>
                        Receiver ID
                        <input
                            type="number"
                            min="1"
                            value={receiverId}
                            onChange={(event) =>
                                setReceiverId(event.target.value)
                            }
                        />
                    </label>
                    <label>
                        Amount
                        <input
                            type="number"
                            min="1"
                            value={sendAmount}
                            onChange={(event) =>
                                setSendAmount(event.target.value)
                            }
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleSendMoney}
                        disabled={processing}
                    >
                        {processing ? "Processing..." : "Send"}
                    </button>
                </div>
            </section>

            <section className="panel">
                <h2>Recent Transactions</h2>

                {transactions.length === 0 ? (
                    <p className="empty-state">No transactions yet.</p>
                ) : (
                    <div className="transaction-list">
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="transaction-row"
                            >
                                <span>
                                    {transaction.direction === "SEND"
                                        ? "Sent"
                                        : "Received"}
                                </span>
                                <strong
                                    className={
                                        transaction.direction === "SEND"
                                            ? "amount-negative"
                                            : "amount-positive"
                                    }
                                >
                                    {transaction.direction === "SEND"
                                        ? "-"
                                        : "+"}
                                    INR {Math.abs(Number(transaction.amount))}
                                </strong>
                            </div>
                        ))}
                    </div>
                )}

                {nextCursor && (
                    <button type="button" onClick={loadMore}>
                        Load More
                    </button>
                )}
            </section>
        </main>
    );
}
