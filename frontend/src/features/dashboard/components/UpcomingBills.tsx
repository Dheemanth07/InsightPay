import React, { useEffect, useState, useCallback } from "react";
import { getUpcomingLiabilities } from "../dashboard.api";
import type { Subscription } from "../dashboard.types";
import { getApiErrorMessage } from "../../../shared/api/errors";

const formatInr = (value: number | string) => {
    const amount = Number(value);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
};

export function UpcomingBills() {
    const [upcoming, setUpcoming] = useState<Subscription[]>([]);
    const [total, setTotal] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    const fetchUpcomingBills = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const response = await getUpcomingLiabilities();
            setUpcoming(response.data.upcomingLiabilities || []);
            setTotal(response.data.totalAmount || 0);
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

    // Calculate sum per card for warnings
    const warnings = React.useMemo(() => {
        const cardMap = new Map<string, { issuerBank: string; amount: number }>();
        upcoming.forEach((sub) => {
            const cardKey = sub.cardId;
            const existing = cardMap.get(cardKey);
            const subAmount = Number(sub.amount) || 0;
            if (existing) {
                existing.amount += subAmount;
            } else {
                cardMap.set(cardKey, {
                    issuerBank: sub.card.issuerBank || "Card",
                    amount: subAmount,
                });
            }
        });

        return Array.from(cardMap.values()).map((c) => {
            return `Keep ${formatInr(c.amount)} ready on your ${c.issuerBank} card for next week.`;
        });
    }, [upcoming]);

    const getRelativeDueText = (dateStr: string) => {
        const dueDate = new Date(dateStr);
        const today = new Date();
        const d1 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const d2 = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
        
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return "Due today";
        if (diffDays === 1) return "Due tomorrow";
        if (diffDays > 1) return `Due in ${diffDays} days`;
        if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
        return dueDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    };

    if (loading) {
        return (
            <section className="dashboard-bento-chart flex flex-col justify-between rounded-[28px] border border-[#e8ecf0] bg-white p-6 shadow-[0_1px_0_rgba(15,20,25,0.04),0_12px_40px_rgba(15,20,25,0.06)] sm:p-7">
                <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-[#0f1419]">Upcoming bills</h2>
                    <p className="mt-1 text-sm text-[#6b7280]">Due in the next 7 days</p>
                </div>
                <div className="flex flex-1 items-center justify-center py-12">
                    <p className="text-sm text-[#6b7280]">Loading upcoming bills…</p>
                </div>
            </section>
        );
    }

    if (error) {
        return (
            <section className="dashboard-bento-chart flex flex-col justify-between rounded-[28px] border border-[#e8ecf0] bg-white p-6 shadow-[0_1px_0_rgba(15,20,25,0.04),0_12px_40px_rgba(15,20,25,0.06)] sm:p-7">
                <div>
                    <h2 className="text-lg font-extrabold tracking-tight text-[#0f1419]">Upcoming bills</h2>
                    <p className="mt-1 text-sm text-[#6b7280]">Due in the next 7 days</p>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm font-medium text-red-600 mb-2">{error}</p>
                    <button 
                        onClick={() => void fetchUpcomingBills()}
                        className="rounded-full bg-[#f5f8fb] px-4 py-1.5 text-xs font-bold text-[#0d6b5f] border border-[#dce4e8] hover:bg-[#e8eff5] transition"
                    >
                        Retry
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className="dashboard-bento-chart flex flex-col justify-between rounded-[28px] border border-[#e8ecf0] bg-white p-6 shadow-[0_1px_0_rgba(15,20,25,0.04),0_12px_40px_rgba(15,20,25,0.06)] sm:p-7">
            <div className="flex flex-col flex-1">
                <div className="mb-4 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold tracking-tight text-[#0f1419]">Upcoming bills</h2>
                        <p className="mt-1 text-sm text-[#6b7280]">Due in the next 7 days</p>
                    </div>
                    {upcoming.length > 0 && (
                        <span className="inline-flex items-center rounded-full bg-[#fffbeb] px-2.5 py-0.5 text-xs font-bold text-[#854d0e] border border-[#fef08a]">
                            Total: {formatInr(total)}
                        </span>
                    )}
                </div>

                {upcoming.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
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
                        {/* Dynamic Warning Messages */}
                        <div className="space-y-2 mb-4">
                            {warnings.map((warning, idx) => (
                                <div 
                                    key={idx} 
                                    className="rounded-2xl bg-[#fffbeb] border border-[#fef08a] p-3 text-xs font-bold text-[#854d0e] leading-relaxed transition hover:scale-[1.01] hover:shadow-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#ca8a04]" />
                                        <span>{warning}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bills List */}
                        <div className="flex-1 overflow-y-auto max-h-[170px] pr-1 space-y-2">
                            {upcoming.map((sub) => (
                                <div
                                    key={sub.id}
                                    className="flex items-center justify-between rounded-2xl border border-[#edf1f3] bg-[#fafbfc] p-3.5 transition duration-200 hover:border-[#fef08a] hover:bg-[#fffbeb] hover:shadow-[0_4px_12px_rgba(254,240,138,0.15)]"
                                >
                                    <div className="min-w-0 flex-1 pr-2">
                                        <p className="truncate text-sm font-bold text-[#0f1419]">
                                            {sub.merchantName}
                                        </p>
                                        <p className="mt-0.5 text-xs font-semibold text-[#6b7280]">
                                            {getRelativeDueText(sub.nextBillingDate)}
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
    );
}
