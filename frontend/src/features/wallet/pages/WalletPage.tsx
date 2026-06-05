import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import {
    addMoney,
    getWalletOwner,
    sendMoney,
    withdrawMoney,
} from "../wallet.api";

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

    const fetchWalletData = useCallback(async () => {
        try {
            setLoading(true);
            const userResponse = await getWalletOwner();
            setBalance(Number(userResponse.data.balance || 0));
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

    const handleWithdrawMoney = async () => {
        const amount = Number(withdrawAmount);

        if (!amount || amount <= 0) return;

        if (amount > balance) {
            setActionError("Insufficient balance");
            return;
        }

        setProcessing(true);
        setActionError("");

        try {
            setBalance((currentBalance) => currentBalance - amount);
            await withdrawMoney(amount);
            setWithdrawAmount("");
            await fetchWalletData();
        } catch (err) {
            setActionError(getApiErrorMessage(err, "Withdrawal failed"));
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
