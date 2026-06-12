import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { getUsersSuggestions, searchUsers, initiateSplit } from "../splits.api";
import type { SplitUser } from "../splits.api";
import type { Transaction } from "../transactions.types";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { Spinner } from "../../../shared/components/Spinner";

export interface SplitBillModalProps {
    transaction: Transaction;
    onClose: () => void;
    onSuccess?: () => void;
}

export function SplitBillModal({ transaction, onClose, onSuccess }: SplitBillModalProps) {
    const [suggestions, setSuggestions] = useState<SplitUser[]>([]);
    const [searchResults, setSearchResults] = useState<SplitUser[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchSuggestions = async () => {
            try {
                setLoadingSuggestions(true);
                setError("");
                const response = await getUsersSuggestions();
                setSuggestions(response.data.users || []);
            } catch (err) {
                console.error("Error fetching suggestions:", err);
                setError(getApiErrorMessage(err, "Failed to load suggested contacts."));
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
                setError("");
                const response = await searchUsers(debouncedSearch.trim());
                setSearchResults(response.data.users || []);
            } catch (err) {
                console.error("Error searching users:", err);
                setError(getApiErrorMessage(err, "Failed to load search results."));
            } finally {
                setLoadingSearch(false);
            }
        };

        void fetchSearchResults();
    }, [debouncedSearch]);

    const amount = Number(transaction.amount) || 0;

    const splitDetails = useMemo(() => {
        const totalPeople = selectedUsers.length + 1;
        const share = totalPeople > 1 ? Number((amount / totalPeople).toFixed(2)) : 0;
        return { totalPeople, share };
    }, [amount, selectedUsers]);

    const handleToggleUser = (userId: number) => {
        setSelectedUsers((current) =>
            current.includes(userId)
                ? current.filter((id) => id !== userId)
                : [...current, userId]
        );
    };

    const handleSplitSubmit = async () => {
        if (selectedUsers.length === 0) {
            toast.error("Please select at least one contact to split with.");
            return;
        }

        setSubmitting(true);

        try {
            const splitPayload = selectedUsers.map((payerId) => ({
                payerId,
                amountOwed: splitDetails.share,
            }));

            await initiateSplit({
                transactionId: transaction.id,
                splits: splitPayload,
            });

            toast.success("Split requests sent successfully!");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Error creating split:", err);
            toast.error(getApiErrorMessage(err, "Failed to split bill."));
        } finally {
            setSubmitting(false);
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
    };

    return (
        <div 
            className="filter-panel-overlay"
            style={{ 
                position: "fixed", 
                inset: 0, 
                backgroundColor: "rgba(15, 23, 42, 0.4)", 
                zIndex: 1000, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                padding: "1rem" 
            }}
            onClick={onClose}
        >
            <div 
                className="filter-panel" 
                style={{ 
                    width: "min(100%, 460px)", 
                    maxHeight: "85vh", 
                    overflowY: "auto", 
                    backgroundColor: "#ffffff", 
                    borderRadius: "20px", 
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.04)", 
                    border: "1px solid #e8ecf0",
                    padding: "1.75rem",
                    margin: 0
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="filter-header" style={{ marginBottom: "1.25rem" }}>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: 0, color: "#0f1419" }}>Split this bill</h2>
                    <button 
                        type="button" 
                        className="secondary-button" 
                        onClick={onClose}
                        style={{ margin: 0, padding: "0.5rem 1rem", borderRadius: "999px" }}
                    >
                        Cancel
                    </button>
                </div>

                <div 
                    style={{ 
                        border: "1px solid #edf1f3", 
                        borderRadius: "16px", 
                        padding: "1rem", 
                        backgroundColor: "#fafbfc", 
                        marginBottom: "1.5rem" 
                    }}
                >
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>Original Bill</p>
                    <p style={{ margin: "0.25rem 0 0.5rem", fontSize: "1.5rem", fontWeight: 800, color: "#0f1419" }}>
                        INR {amount.toFixed(2)}
                    </p>
                    <p style={{ margin: 0, fontSize: "0.8rem", color: "#475569" }}>
                        {transaction.type} • {new Date(transaction.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                </div>

                {error ? (
                    <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#b42318" }}>
                        <p style={{ fontSize: "0.9rem", fontWeight: 600 }}>{error}</p>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <label style={{ display: "grid", gap: "0.35rem", color: "#475569", fontSize: "0.85rem", fontWeight: 600 }}>
                            Select friends to split with
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
                                maxHeight: "200px", 
                                overflowY: "auto", 
                                border: "1px solid #edf1f3", 
                                borderRadius: "14px",
                                padding: "0.5rem"
                            }}
                        >
                            {search === "" ? (
                                loadingSuggestions ? (
                                    <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                                        <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>Loading suggestions…</p>
                                    </div>
                                ) : suggestions.length === 0 ? (
                                    <p style={{ textAlign: "center", padding: "1rem 0", color: "#9aa3ad", fontSize: "0.85rem" }}>
                                        No suggestions available.
                                    </p>
                                ) : (
                                    <div>
                                        <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#6b7280", margin: "0.25rem 0.5rem 0.5rem" }}>
                                            Suggested
                                        </p>
                                        {suggestions.map((user) => {
                                            const isSelected = selectedUsers.includes(user.id);
                                            return (
                                                <div
                                                    key={user.id}
                                                    onClick={() => handleToggleUser(user.id)}
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        padding: "0.6rem 0.75rem",
                                                        borderRadius: "10px",
                                                        cursor: "pointer",
                                                        transition: "background 0.2s",
                                                        backgroundColor: isSelected ? "#f0fdf4" : "transparent"
                                                    }}
                                                    className="hover:bg-[#f8fafb]"
                                                >
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        <div 
                                                            style={{ 
                                                                width: "36px", 
                                                                height: "36px", 
                                                                borderRadius: "50%", 
                                                                border: isSelected ? "1px solid #86efac" : "1px solid #e8ecf0", 
                                                                backgroundColor: isSelected ? "#bbf7d0" : "#f1f5f9", 
                                                                display: "flex", 
                                                                alignItems: "center", 
                                                                justifyContent: "center",
                                                                fontSize: "0.85rem",
                                                                fontWeight: 700,
                                                                color: isSelected ? "#166534" : "#475569"
                                                            }}
                                                        >
                                                            {getInitials(user.name)}
                                                        </div>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>
                                                                {user.name}
                                                            </p>
                                                            <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected}
                                                        onChange={() => {}}
                                                        style={{ width: "auto", minWidth: "auto", margin: 0, pointerEvents: "none" }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )
                            ) : search.length < 2 ? (
                                <p style={{ textAlign: "center", padding: "1.5rem 0", color: "#6b7280", fontSize: "0.85rem" }}>
                                    Type at least 2 characters to search...
                                </p>
                            ) : loadingSearch ? (
                                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                                    <p style={{ color: "#6b7280", fontSize: "0.85rem" }}>Searching contacts…</p>
                                </div>
                            ) : searchResults.length === 0 ? (
                                <p style={{ textAlign: "center", padding: "1rem 0", color: "#9aa3ad", fontSize: "0.85rem" }}>
                                    No contacts found matching "{search}".
                                </p>
                            ) : (
                                <div>
                                    {searchResults.map((user) => {
                                        const isSelected = selectedUsers.includes(user.id);
                                        return (
                                            <div
                                                key={user.id}
                                                onClick={() => handleToggleUser(user.id)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    padding: "0.6rem 0.75rem",
                                                    borderRadius: "10px",
                                                    cursor: "pointer",
                                                    transition: "background 0.2s",
                                                    backgroundColor: isSelected ? "#f0fdf4" : "transparent"
                                                }}
                                                className="hover:bg-[#f8fafb]"
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                    <div 
                                                        style={{ 
                                                            width: "36px", 
                                                            height: "36px", 
                                                            borderRadius: "50%", 
                                                            border: isSelected ? "1px solid #86efac" : "1px solid #e8ecf0", 
                                                            backgroundColor: isSelected ? "#bbf7d0" : "#f1f5f9", 
                                                            display: "flex", 
                                                            alignItems: "center", 
                                                            justifyContent: "center",
                                                            fontSize: "0.85rem",
                                                            fontWeight: 700,
                                                            color: isSelected ? "#166534" : "#475569"
                                                        }}
                                                    >
                                                        {getInitials(user.name)}
                                                    </div>
                                                    <div>
                                                        <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#1e293b" }}>
                                                            {user.name}
                                                        </p>
                                                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    style={{ width: "auto", minWidth: "auto", margin: 0, pointerEvents: "none" }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {selectedUsers.length > 0 && (
                            <div 
                                style={{ 
                                    padding: "1rem", 
                                    borderRadius: "14px", 
                                    backgroundColor: "#f0fdf4", 
                                    border: "1px solid #bbf7d0", 
                                    color: "#166534",
                                    fontSize: "0.85rem" 
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                                    <span>Splitting with:</span>
                                    <span>{selectedUsers.length} contact{selectedUsers.length > 1 ? "s" : ""}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.35rem" }}>
                                    <span>Each person owes:</span>
                                    <strong>INR {splitDetails.share.toFixed(2)}</strong>
                                </div>
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleSplitSubmit}
                            disabled={submitting || selectedUsers.length === 0}
                            className="flex items-center justify-center"
                            style={{ 
                                width: "100%", 
                                padding: "0.85rem", 
                                borderRadius: "12px", 
                                fontWeight: 700, 
                                fontSize: "0.95rem",
                                marginTop: "0.5rem"
                            }}
                        >
                            {submitting ? <Spinner size="h-5 w-5" color="text-white" /> : "Split this bill"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
