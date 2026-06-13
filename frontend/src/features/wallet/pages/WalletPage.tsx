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
    getUsersSuggestions,
    searchUsers,
} from "../../transactions/splits.api";
import type { SplitRequest, SplitUser } from "../../transactions/splits.api";
import { Spinner } from "../../../shared/components/Spinner";
import { Skeleton } from "../../../shared/components/Skeleton";

export function WalletPage() {
    const [balance, setBalance] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [addAmount, setAddAmount] = useState("");
    const [selectedReceiver, setSelectedReceiver] = useState<SplitUser | null>(null);
    const [sendAmount, setSendAmount] = useState("");
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [processing, setProcessing] = useState(false);
    const [actionError, setActionError] = useState("");
    const [pendingSplits, setPendingSplits] = useState<SplitRequest[]>([]);
    
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [suggestions, setSuggestions] = useState<SplitUser[]>([]);
    const [searchResults, setSearchResults] = useState<SplitUser[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [loadingSearch, setLoadingSearch] = useState(false);

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

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                setLoadingSuggestions(true);
                const response = await getUsersSuggestions();
                setSuggestions(response.data.users || []);
            } catch (err) {
                console.error("Error fetching suggestions:", err);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        void fetchSuggestions();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [search]);

    useEffect(() => {
        const fetchSearchResults = async () => {
            if (debouncedSearch.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            try {
                setLoadingSearch(true);
                const response = await searchUsers(debouncedSearch.trim());
                setSearchResults(response.data.users || []);
            } catch (err) {
                console.error("Error searching users:", err);
            } finally {
                setLoadingSearch(false);
            }
        };

        void fetchSearchResults();
    }, [debouncedSearch]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

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

        if (!selectedReceiver || !amount || amount <= 0) return;

        if (amount > balance) {
            setActionError("Insufficient balance");
            toast.error("Not enough balance for this transfer.");
            return;
        }

        setProcessing(true);
        setActionError("");

        try {
            setBalance((currentBalance) => currentBalance - amount);
            await sendMoney(selectedReceiver.id, amount);
            setSelectedReceiver(null);
            setSendAmount("");
            setSearch("");
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
        return (
            <main className="app-page wallet-page">
                <header className="page-header">
                    <div>
                        <Skeleton width="w-16" height="h-3.5" rounded="rounded-md" className="mb-2" />
                        <Skeleton width="w-56" height="h-8" rounded="rounded-lg" />
                    </div>
                </header>

                <section className="panel balance-panel flex flex-col justify-center space-y-3">
                    <Skeleton width="w-24" height="h-4" rounded="rounded-md" />
                    <Skeleton width="w-40" height="h-8" rounded="rounded-md" />
                </section>

                <section className="wallet-actions">
                    <div className="wallet-actions-row">
                        <div className="panel space-y-4">
                            <Skeleton width="w-28" height="h-6" rounded="rounded-md" />
                            <div className="space-y-2">
                                <Skeleton width="w-16" height="h-3.5" rounded="rounded-md" />
                                <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                            </div>
                            <Skeleton width="w-full" height="h-12" rounded="rounded-lg" />
                        </div>

                        <div className="panel space-y-4">
                            <Skeleton width="w-36" height="h-6" rounded="rounded-md" />
                            <div className="space-y-2">
                                <Skeleton width="w-16" height="h-3.5" rounded="rounded-md" />
                                <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                            </div>
                            <Skeleton width="w-full" height="h-12" rounded="rounded-lg" />
                        </div>
                    </div>

                    <div className="panel space-y-4">
                        <Skeleton width="w-28" height="h-6" rounded="rounded-md" />
                        <div className="space-y-2">
                            <Skeleton width="w-20" height="h-3.5" rounded="rounded-md" />
                            <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton width="w-16" height="h-3.5" rounded="rounded-md" />
                            <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                        </div>
                        <Skeleton width="w-full" height="h-12" rounded="rounded-lg" />
                    </div>
                </section>
            </main>
        );
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
                <h2>₹ {balance.toFixed(2)}</h2>
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
                            className="w-full flex items-center justify-center"
                        >
                            {processing ? <Spinner size="h-5 w-5" color="text-white" /> : "Add Money"}
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
                            className="w-full flex items-center justify-center"
                        >
                            {processing ? <Spinner size="h-5 w-5" color="text-white" /> : "Withdraw"}
                        </button>
                    </div>
                </div>

                <div className="panel">
                    <h2>Send Money</h2>
                    
                    {selectedReceiver ? (
                        <div 
                            style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                justifyContent: "space-between", 
                                padding: "0.75rem 1rem", 
                                borderRadius: "12px", 
                                border: "1px solid #bbf7d0", 
                                backgroundColor: "#f0fdf4", 
                                marginBottom: "1rem" 
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minWidth: 0 }}>
                                <div 
                                    style={{ 
                                        width: "36px", 
                                        height: "36px", 
                                        borderRadius: "50%", 
                                        backgroundColor: "#bbf7d0", 
                                        border: "1px solid #86efac", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        justifyContent: "center",
                                        fontSize: "0.85rem",
                                        fontWeight: 700,
                                        color: "#166534",
                                        flexShrink: 0
                                    }}
                                >
                                    {getInitials(selectedReceiver.name)}
                                </div>
                                <div style={{ minWidth: 0 }}>
                                    <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {selectedReceiver.name}
                                    </p>
                                    <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {selectedReceiver.email}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedReceiver(null)}
                                className="secondary-button"
                                style={{ 
                                    margin: 0, 
                                    padding: "0.3rem 0.75rem", 
                                    fontSize: "0.75rem", 
                                    borderRadius: "999px",
                                    border: "1px solid #dce4e8",
                                    backgroundColor: "#ffffff",
                                    color: "#6b7280"
                                }}
                            >
                                Change
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1rem" }}>
                            <label style={{ display: "grid", gap: "0.35rem", color: "#475569", fontSize: "0.85rem", fontWeight: 600 }}>
                                Search Contact
                                <div style={{ position: "relative", width: "100%" }}>
                                    <input 
                                        type="text" 
                                        placeholder="Search by name or email" 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ 
                                            padding: "0.65rem 2.25rem 0.65rem 0.85rem", 
                                            fontSize: "0.9rem", 
                                            borderRadius: "10px", 
                                            border: "1px solid #dce4e8", 
                                            width: "100%",
                                            marginBottom: 0
                                        }}
                                    />
                                    {loadingSearch && (
                                        <div style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)" }}>
                                            <Spinner size="h-4 w-4" color="text-emerald-800" />
                                        </div>
                                    )}
                                </div>
                            </label>

                            <div 
                                style={{ 
                                    maxHeight: "160px", 
                                    overflowY: "auto", 
                                    border: "1px solid #edf1f3", 
                                    borderRadius: "14px",
                                    padding: "0.5rem",
                                    backgroundColor: "#ffffff"
                                }}
                            >
                                {search === "" ? (
                                    loadingSuggestions ? (
                                        <div style={{ textAlign: "center", padding: "1rem 0" }}>
                                            <p style={{ color: "#6b7280", fontSize: "0.8rem" }}>Loading suggestions…</p>
                                        </div>
                                    ) : suggestions.length === 0 ? (
                                        <p style={{ textAlign: "center", padding: "0.75rem 0", color: "#9aa3ad", fontSize: "0.8rem" }}>
                                            No suggestions available.
                                        </p>
                                    ) : (
                                        <div>
                                            <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b7280", margin: "0.15rem 0.5rem 0.35rem" }}>
                                                Suggested
                                            </p>
                                            {suggestions.map((user) => (
                                                <div
                                                    key={user.id}
                                                    onClick={() => setSelectedReceiver(user)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "0.75rem",
                                                        padding: "0.5rem 0.6rem",
                                                        borderRadius: "8px",
                                                        cursor: "pointer",
                                                        transition: "background 0.2s"
                                                    }}
                                                    className="hover:bg-[#f8fafb]"
                                                >
                                                    <div 
                                                        style={{ 
                                                            width: "30px", 
                                                            height: "30px", 
                                                            borderRadius: "50%", 
                                                            backgroundColor: "#f1f5f9", 
                                                            border: "1px solid #e8ecf0", 
                                                            display: "flex", 
                                                            alignItems: "center", 
                                                            justifyContent: "center",
                                                            fontSize: "0.75rem",
                                                            fontWeight: 700,
                                                            color: "#475569"
                                                        }}
                                                    >
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {user.name}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: "0.7rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )
                                ) : search.length < 2 ? (
                                    <p style={{ textAlign: "center", padding: "1rem 0", color: "#6b7280", fontSize: "0.8rem" }}>
                                        Type at least 2 characters to search...
                                    </p>
                                ) : loadingSearch ? (
                                    <div style={{ textAlign: "center", padding: "1rem 0" }}>
                                        <p style={{ color: "#6b7280", fontSize: "0.8rem" }}>Searching contacts…</p>
                                    </div>
                                ) : searchResults.length === 0 ? (
                                    <p style={{ textAlign: "center", padding: "0.75rem 0", color: "#9aa3ad", fontSize: "0.8rem" }}>
                                        No contacts found matching "{search}".
                                    </p>
                                ) : (
                                    <div>
                                        {searchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                onClick={() => setSelectedReceiver(user)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.75rem",
                                                    padding: "0.5rem 0.6rem",
                                                    borderRadius: "8px",
                                                    cursor: "pointer",
                                                    transition: "background 0.2s"
                                                }}
                                                className="hover:bg-[#f8fafb]"
                                            >
                                                <div 
                                                    style={{ 
                                                        width: "30px", 
                                                        height: "30px", 
                                                        borderRadius: "50%", 
                                                        backgroundColor: "#f1f5f9", 
                                                        border: "1px solid #e8ecf0", 
                                                        display: "flex", 
                                                        alignItems: "center", 
                                                        justifyContent: "center",
                                                        fontSize: "0.75rem",
                                                        fontWeight: 700,
                                                        color: "#475569"
                                                    }}
                                                >
                                                    {getInitials(user.name)}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {user.name}
                                                    </p>
                                                    <p style={{ margin: 0, fontSize: "0.7rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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
                        disabled={processing || !selectedReceiver}
                        className="w-full flex items-center justify-center"
                    >
                        {processing ? <Spinner size="h-5 w-5" color="text-white" /> : "Send"}
                    </button>
                </div>
            </section>
        </main>
    );
}
