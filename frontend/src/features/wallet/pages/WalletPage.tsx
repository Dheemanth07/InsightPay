import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../../shared/api/errors";
import {
    addMoney,
    getWalletOwner,
    sendMoney,
    withdrawMoney,
} from "../wallet.api";
import {
    getIncomingPendingSplits,
    paySplitShare,
    rejectSplitShare,
} from "../../transactions/splits.api";
import type { SplitRequest } from "../../transactions/splits.api";

export function WalletPage() {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [addAmount, setAddAmount] = useState("");
    const [receiverId, setReceiverId] = useState("");
    const [sendAmount, setSendAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [processing, setProcessing] = useState(false);
    const [actionError, setActionError] = useState("");
    const [pendingSplits, setPendingSplits] = useState<SplitRequest[]>([]);

    const fetchWalletData = useCallback(async () => {
        try {
            setLoading(true);
            const [userResponse, splitsResponse] = await Promise.all([
                getWalletOwner(),
                getIncomingPendingSplits(),
            ]);
            setBalance(Number(userResponse.data.balance || 0));
            setPendingSplits(splitsResponse.data.splits || []);
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
            toast.success("Added! Your balance is looking good.");
            await fetchWalletData();
        } catch (err) {
            const message = getApiErrorMessage(err, "Failed to add money");
            setActionError(message);
            toast.error("Oops! Something went wrong while adding money.");
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
            toast.error("Not enough balance for this transfer.");
            return;
        }

        setProcessing(true);
        setActionError("");

        try {
            setBalance((currentBalance) => currentBalance - amount);
            await sendMoney(receiver, amount);
            setReceiverId("");
            setSendAmount("");
            toast.success("Sent! Your money is on its way.");
            await fetchWalletData();
        } catch (err) {
            const message = getApiErrorMessage(err, "Transfer failed");
            setActionError(message);
            toast.error("Transfer failed. Please check the details.");
            await fetchWalletData();
        } finally {
            setProcessing(false);
        }
    };

    const handleWithdrawMoney = async () => {
        const amount = Number(withdrawAmount);

        if (!amount || amount <= 0) return;

        if (amount > balance) {
            setActionError("Insufficient balance");
            toast.error("You don't have enough to withdraw that much.");
            return;
        }

        setProcessing(true);
        setActionError("");

        try {
            setBalance((currentBalance) => currentBalance - amount);
            await withdrawMoney(amount);
            setWithdrawAmount("");
            toast.success("Done! Your withdrawal is being processed.");
            await fetchWalletData();
        } catch (err) {
            const message = getApiErrorMessage(err, "Withdrawal failed");
            setActionError(message);
            toast.error("Withdrawal failed. Try again in a bit?");
            await fetchWalletData();
        } finally {
            setProcessing(false);
        }
    };

    const handlePaySplitShare = async (splitId: string, amount: number) => {
        if (amount > balance) {
            toast.error("Insufficient wallet balance to pay split share.");
            return;
        }

        setProcessing(true);
        setActionError("");

        try {
            setBalance((currentBalance) => currentBalance - amount);
            await paySplitShare(splitId);
            toast.success("Split paid successfully!");
            await fetchWalletData();
        } catch (err) {
            const message = getApiErrorMessage(err, "Failed to pay split share");
            setActionError(message);
            toast.error("Failed to pay split share. Please try again.");
            await fetchWalletData();
        } finally {
            setProcessing(false);
        }
    };

    const handleRejectSplitShare = async (splitId: string) => {
        setProcessing(true);
        setActionError("");

        try {
            await rejectSplitShare(splitId);
            toast.success("Split request rejected.");
            await fetchWalletData();
        } catch (err) {
            const message = getApiErrorMessage(err, "Failed to reject split request");
            setActionError(message);
            toast.error("Failed to reject split request.");
            await fetchWalletData();
        } finally {
            setProcessing(false);
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

            {pendingSplits.length > 0 && (
                <section className="panel" style={{ border: "1px solid #edf1f3", backgroundColor: "#fafbfc" }}>
                    <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f1419", marginBottom: "1rem" }}>
                        Pending Splits
                    </h2>
                    <div className="transaction-list" style={{ display: "grid", gap: "0.75rem" }}>
                        {pendingSplits.map((split) => (
                            <div 
                                key={split.id} 
                                className="transaction-row" 
                                style={{ 
                                    display: "flex", 
                                    alignItems: "center", 
                                    justifyContent: "space-between",
                                    padding: "1rem 1.25rem",
                                    borderRadius: "14px",
                                    border: "1px solid #edf1f3",
                                    backgroundColor: "#ffffff"
                                }}
                            >
                                <div style={{ minWidth: 0, flex: 1, paddingRight: "1rem" }}>
                                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>
                                        {split.requester?.name} requested a split
                                    </p>
                                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
                                        Original txn: {split.transaction.type} • {split.transaction.category?.name || "Uncategorized"}
                                    </p>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                    <strong style={{ fontSize: "0.95rem", color: "#b42318", fontWeight: 800 }}>
                                        INR {Number(split.amountOwed).toFixed(2)}
                                    </strong>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <button
                                            type="button"
                                            onClick={() => handlePaySplitShare(split.id, Number(split.amountOwed))}
                                            disabled={processing}
                                            style={{
                                                padding: "0.45rem 1rem",
                                                borderRadius: "999px",
                                                fontSize: "0.8rem",
                                                margin: 0
                                            }}
                                        >
                                            Pay
                                        </button>
                                        <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => handleRejectSplitShare(split.id)}
                                            disabled={processing}
                                            style={{
                                                padding: "0.45rem 1rem",
                                                borderRadius: "999px",
                                                fontSize: "0.8rem",
                                                border: "1px solid #b42318",
                                                color: "#b42318",
                                                margin: 0
                                            }}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {actionError && <p className="error-text">{actionError}</p>}

            <section className="wallet-actions">
                <div className="wallet-actions-row">
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
                        <h2>Withdraw Money</h2>
                        <label>
                            Amount
                            <input
                                type="number"
                                min="1"
                                value={withdrawAmount}
                                onChange={(event) =>
                                    setWithdrawAmount(event.target.value)
                                }
                            />
                        </label>
                        <button
                            type="button"
                            onClick={handleWithdrawMoney}
                            disabled={processing}
                        >
                            {processing ? "Processing..." : "Withdraw"}
                        </button>
                    </div>
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
        </main>
    );
}
