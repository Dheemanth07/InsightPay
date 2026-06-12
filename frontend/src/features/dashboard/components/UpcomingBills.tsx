import { useCallback, useEffect, useRef, useState } from "react";
import { getUpcomingLiabilities, createSubscription } from "../dashboard.api";
import { getCards } from "../../cards/cards.api";
import type { Subscription } from "../dashboard.types";
import type { Card } from "../../cards/cards.types";
import { getApiErrorMessage } from "../../../shared/api/errors";
// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
const formatInr = (value: number | string) => {
    const amount = Number(value);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
};
const getRelativeDueText = (dateStr: string) => {
    const dueDate = new Date(dateStr);
    const today = new Date();
    const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d2 = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / 86_400_000);
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays > 1) return `Due in ${diffDays} days`;
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""}`;
};
// ─────────────────────────────────────────────────────
// Shimmer skeleton row
// ─────────────────────────────────────────────────────
function SkeletonRow() {
    return (
        <div className="flex items-center justify-between rounded-2xl border border-[#edf1f3] bg-[#fafbfc] p-3.5 animate-pulse">
            <div className="flex-1 pr-2 space-y-2">
                <div className="h-3.5 w-28 rounded-full bg-gray-200" />
                <div className="h-2.5 w-16 rounded-full bg-gray-100" />
            </div>
            <div className="text-right space-y-2">
                <div className="h-3.5 w-14 rounded-full bg-gray-200 ml-auto" />
                <div className="h-2.5 w-20 rounded-full bg-gray-100 ml-auto" />
            </div>
        </div>
    );
}
// ─────────────────────────────────────────────────────
// Add Bill Modal
// ─────────────────────────────────────────────────────
interface AddBillModalProps {
    cards: Card[];
    onClose: () => void;
    onSaved: () => void;
}
function AddBillModal({ cards, onClose, onSaved }: AddBillModalProps) {
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [cardId, setCardId] = useState(cards[0]?.id ?? "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        inputRef.current?.focus();
    }, []);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !amount || !dueDate || !cardId) {
            setError("All fields are required.");
            return;
        }
        const parsedAmount = parseFloat(amount);
        if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("Enter a valid positive amount.");
            return;
        }
        setSaving(true);
        setError("");
        try {
            await createSubscription({
                name: name.trim(),
                amount: parsedAmount,
                dueDate: new Date(dueDate).toISOString(),
                cardId,
            });
            onSaved();
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to save subscription."));
        } finally {
            setSaving(false);
        }
    };
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-xl max-w-sm w-full mx-4 p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", marginBottom: "0.25rem" }}>
                    Track a Bill
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "1.25rem" }}>
                    Add a subscription or upcoming payment to track it in your 7-day window.
                </p>
                {error && (
                    <p style={{ color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.75rem", fontWeight: 600 }}>
                        {error}
                    </p>
                )}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {/* Name */}
                    <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>
                        Subscription Name
                        <input
                            ref={inputRef}
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Netflix Premium"
                            style={{ padding: "0.55rem 0.75rem", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: "0.9rem", outline: "none", marginBottom: 0 }}
                        />
                    </label>
                    {/* Amount */}
                    <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>
                        Amount (INR)
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#6b7280", fontWeight: 600, pointerEvents: "none" }}>
                                ₹
                            </span>
                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="649"
                                style={{ width: "100%", paddingLeft: "1.75rem", padding: "0.55rem 0.75rem 0.55rem 1.75rem", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: "0.9rem", outline: "none", marginBottom: 0 }}
                            />
                        </div>
                    </label>
                    {/* Due Date */}
                    <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>
                        Due Date
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            style={{ padding: "0.55rem 0.75rem", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: "0.9rem", outline: "none", marginBottom: 0 }}
                        />
                    </label>
                    {/* Card */}
                    <label style={{ display: "flex", flexDirection: "column", gap: "0.3rem", fontSize: "0.82rem", fontWeight: 600, color: "#374151" }}>
                        Charge to Card
                        {cards.length === 0 ? (
                            <p style={{ fontSize: "0.8rem", color: "#dc2626" }}>No saved cards. Add a card first.</p>
                        ) : (
                            <select
                                value={cardId}
                                onChange={(e) => setCardId(e.target.value)}
                                style={{ padding: "0.55rem 0.75rem", borderRadius: 10, border: "1.5px solid #e5e7eb", fontSize: "0.9rem", marginBottom: 0 }}
                            >
                                {cards.map((card) => (
                                    <option key={card.id} value={card.id}>
                                        {card.issuerBank} •••• {card.last4} ({card.brand})
                                    </option>
                                ))}
                            </select>
                        )}
                    </label>
                    {/* Buttons */}
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.25rem" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{ flex: 1, padding: "0.65rem", borderRadius: 10, border: "1.5px solid #e5e7eb", background: "transparent", color: "#374151", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving || cards.length === 0}
                            style={{ flex: 1, padding: "0.65rem", borderRadius: 10, border: "none", background: "#0d6b5f", color: "#fff", fontWeight: 700, fontSize: "0.88rem", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}
                        >
                            {saving ? "Saving…" : "Track Bill"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
// ─────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────
export function UpcomingBills() {
    const [upcoming, setUpcoming] = useState<Subscription[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [cards, setCards] = useState<Card[]>([]);
    const fetchUpcomingBills = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const [billsRes, cardsRes] = await Promise.all([
                getUpcomingLiabilities(),
                getCards(),
            ]);
            setUpcoming(billsRes.data.upcomingLiabilities || []);
            setTotal(billsRes.data.totalAmount || 0);
            setCards(cardsRes.data.cards || []);
        } catch (err) {
            console.error("Error loading upcoming bills:", err);
            setError(getApiErrorMessage(err, "Could not load upcoming bills."));
        } finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void fetchUpcomingBills();
    }, [fetchUpcomingBills]);
    const sectionClass =
        "dashboard-bento-chart flex flex-col rounded-[28px] border border-[#e8ecf0] bg-white p-6 shadow-[0_1px_0_rgba(15,20,25,0.04),0_12px_40px_rgba(15,20,25,0.06)] sm:p-7";
    // ── Header shared across all states
    const Header = ({ showAdd = true }: { showAdd?: boolean }) => (
        <div className="mb-4 flex items-start justify-between">
            <div>
                <h2 className="text-lg font-extrabold tracking-tight text-[#0f1419]">Upcoming bills</h2>
                <p className="mt-0.5 text-sm text-[#6b7280]">Due in the next 7 days</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {upcoming.length > 0 && !loading && (
                    <span className="inline-flex items-center rounded-full bg-[#fffbeb] px-2.5 py-0.5 text-xs font-bold text-[#854d0e] border border-[#fef08a]">
                        {formatInr(total)}
                    </span>
                )}
                {showAdd && (
                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            padding: "0.3rem 0.75rem",
                            borderRadius: 999,
                            border: "1.5px solid #0d6b5f",
                            background: "transparent",
                            color: "#0d6b5f",
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            transition: "background 0.15s",
                            whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "#f0fdf4"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                        <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 13, height: 13 }}>
                            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                        Track Bill
                    </button>
                )}
            </div>
        </div>
    );
    // ── Loading skeleton
    if (loading) {
        return (
            <section className={sectionClass}>
                <Header showAdd={false} />
                <div className="space-y-2.5">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                </div>
            </section>
        );
    }
    // ── Error state
    if (error) {
        return (
            <section className={sectionClass}>
                <Header />
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm font-medium text-red-600 mb-2">{error}</p>
                    <button
                        onClick={() => void fetchUpcomingBills()}
                        className="rounded-full bg-[#f5f8fb] px-4 py-1.5 text-xs font-bold text-[#0d6b5f] border border-[#dce4e8] hover:bg-[#e8eff5] transition"
                    >
                        Retry
                    </button>
                </div>
                {showModal && (
                    <AddBillModal
                        cards={cards}
                        onClose={() => setShowModal(false)}
                        onSaved={() => { setShowModal(false); void fetchUpcomingBills(); }}
                    />
                )}
            </section>
        );
    }
    return (
        <>
            <section className={sectionClass}>
                <div className="flex flex-col flex-1">
                    <Header />
                    {upcoming.length === 0 ? (
                        // ── Empty state
                        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]">
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-sm font-bold text-[#1f2937]">All caught up!</p>
                            <p className="mt-1 text-xs text-[#6b7280]">No bills due in the next 7 days.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 min-h-0">
                            {/* Bills list */}
                            <div className="flex-1 overflow-y-auto max-h-[220px] pr-0.5 space-y-2">
                                {upcoming.map((sub) => (
                                    <div
                                        key={sub.id}
                                        className="flex items-center justify-between rounded-2xl border border-[#edf1f3] bg-[#fafbfc] p-3.5 transition duration-200 hover:border-[#fef08a] hover:bg-[#fffbeb] hover:shadow-[0_4px_12px_rgba(254,240,138,0.15)]"
                                    >
                                        <div className="min-w-0 flex-1 pr-2">
                                            <p className="truncate text-sm font-bold text-[#0f1419]">
                                                {sub.name || sub.merchantName}
                                            </p>
                                            <p className="mt-0.5 text-xs font-semibold text-[#6b7280]">
                                                {getRelativeDueText(sub.dueDate || sub.nextBillingDate)}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-extrabold tracking-tight text-[#0f1419]">
                                                {formatInr(Number(sub.amount))}
                                            </p>
                                            <p className="mt-0.5 text-[10px] font-bold text-[#6b7280] uppercase tracking-wide">
                                                {sub.card.issuerBank} •••• {sub.card.last4}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
            {showModal && (
                <AddBillModal
                    cards={cards}
                    onClose={() => setShowModal(false)}
                    onSaved={() => { setShowModal(false); void fetchUpcomingBills(); }}
                />
            )}
        </>
    );
}