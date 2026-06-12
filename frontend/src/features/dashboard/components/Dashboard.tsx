import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/auth.context";
import { CreditCard } from "../../cards/components/CreditCard";
import { getCards } from "../../cards/cards.api";
import type { Card } from "../../cards/cards.types";
import { getWalletTransactions } from "../../wallet/wallet.api";
import type { WalletTransaction } from "../../wallet/wallet.types";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { UpcomingBills } from "./UpcomingBills";

const formatInr = (value: number | string) => {
    const amount = Number(value);
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number.isFinite(amount) ? amount : 0);
};

const formatRelativeDate = (isoDate: string) => {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
    });
};

const transactionLabel = (transaction: WalletTransaction) => {
    switch (transaction.direction) {
        case "RECEIVE":
            return "Money in";
        case "SEND":
            return "Sent";
        case "WITHDRAWAL":
            return "Withdrawn";
        default:
            return transaction.type === "DEPOSIT" ? "Added" : "Activity";
    }
};

export function Dashboard() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
    const [primaryCard, setPrimaryCard] = useState<Card | null>(null);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [loadingCard, setLoadingCard] = useState(true);
    const [error, setError] = useState("");

    const balance = Number(user?.balance ?? 0);

    const loadDashboardData = useCallback(async () => {
        setError("");

        try {
            setLoadingTransactions(true);
            setLoadingCard(true);

            const [historyResponse, cardsResponse] = await Promise.all([
                getWalletTransactions(null, 5),
                getCards(),
            ]);

            setTransactions(historyResponse.data.result?.transactions ?? []);
            setPrimaryCard(cardsResponse.data.cards?.[0] ?? null);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Could not load dashboard data. Try again in a moment.",
                ),
            );
        } finally {
            setLoadingTransactions(false);
            setLoadingCard(false);
        }
    }, []);

    useEffect(() => {
        void loadDashboardData();
    }, [loadDashboardData]);

    return (
        <div className="font-sans text-[#141820]">
            <header className="mb-8">
                <p className="text-sm font-semibold tracking-wide text-[#6b7280]">
                    Home
                </p>
                <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-[#0f1419] sm:text-5xl">
                    {user?.name ? `${user.name.split(" ")[0]}'s overview` : "Overview"}
                </h1>
            </header>

            {error ? (
                <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {error}
                </p>
            ) : null}

            <div className="dashboard-bento">
                {/* Wallet balance — top left */}
                <section
                    className="dashboard-bento-wallet flex flex-col justify-between rounded-[28px] border border-[#e8ecf0] bg-white p-6 shadow-[0_1px_0_rgba(15,20,25,0.04),0_12px_40px_rgba(15,20,25,0.06)] sm:p-7"
                >
                    <div>
                        <p className="text-sm font-semibold text-[#6b7280]">
                            Wallet balance
                        </p>
                        <p className="mt-3 text-[2.75rem] font-extrabold leading-none tracking-tight text-[#0f1419] sm:text-5xl">
                            {formatInr(balance)}
                        </p>
                        <p className="mt-3 text-sm text-[#6b7280]">
                            Available to send or withdraw
                        </p>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2">
                        <Link
                            to="/wallet"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#d7dee5] bg-[#f8fafb] px-4 py-2 text-sm font-bold text-[#0f1419] no-underline transition hover:border-[#b8c4cf] hover:bg-white"
                        >
                            <span aria-hidden="true">+</span> Add
                        </Link>
                        <Link
                            to="/wallet"
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#d7dee5] bg-[#f8fafb] px-4 py-2 text-sm font-bold text-[#0f1419] no-underline transition hover:border-[#b8c4cf] hover:bg-white"
                        >
                            <span aria-hidden="true">↑</span> Send
                        </Link>
                    </div>
                </section>

                {/* Active card — top right */}
                <section
                    className="dashboard-bento-card relative overflow-hidden rounded-[28px] border border-[#e8ecf0] bg-[#f3f5f7] p-5 shadow-[0_1px_0_rgba(15,20,25,0.04),0_12px_40px_rgba(15,20,25,0.06)] sm:p-6"
                >
                    <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-extrabold tracking-tight text-[#0f1419]">
                                Your active cards
                            </h2>
                            <p className="mt-1 text-sm text-[#6b7280]">
                                Primary card on file
                            </p>
                        </div>
                        <Link
                            to="/cards"
                            className="shrink-0 text-sm font-bold text-[#0d6b5f] no-underline hover:text-[#094d45]"
                        >
                            Manage
                        </Link>
                    </div>

                    <div className="flex min-h-[210px] items-center justify-center">
                        {loadingCard ? (
                            <p className="text-sm text-[#6b7280]">Loading card…</p>
                        ) : primaryCard ? (
                            <div className="origin-center scale-[0.78] sm:scale-[0.88] lg:scale-100">
                                <CreditCard
                                    brand={primaryCard.brand}
                                    issuerBank={primaryCard.issuerBank}
                                    lastFour={primaryCard.last4}
                                    expiryMonth={primaryCard.expiryMonth}
                                    expiryYear={primaryCard.expiryYear}
                                    userName={user?.name}
                                />
                            </div>
                        ) : (
                            <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#cfd8df] bg-white/70 px-6 py-10 text-center">
                                <p className="text-sm font-semibold text-[#374151]">
                                    No cards saved yet
                                </p>
                                <Link
                                    to="/cards"
                                    className="mt-3 text-sm font-bold text-[#0d6b5f] no-underline hover:text-[#094d45]"
                                >
                                    Add a card
                                </Link>
                            </div>
                        )}
                    </div>
                </section>

                {/* Recent transactions — bottom left */}
                <section
                    className="dashboard-bento-transactions rounded-[28px] border border-[#e8ecf0] bg-white p-6 shadow-[0_1px_0_rgba(15,20,25,0.04),0_12px_40px_rgba(15,20,25,0.06)] sm:p-7"
                >
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-lg font-extrabold tracking-tight text-[#0f1419]">
                                Recent spending
                            </h2>
                            <p className="mt-1 text-sm text-[#6b7280]">
                                Last 5 wallet movements
                            </p>
                        </div>
                        <Link
                            to="/transactions"
                            className="shrink-0 text-sm font-bold text-[#0d6b5f] no-underline hover:text-[#094d45]"
                        >
                            View all
                        </Link>
                    </div>

                    {loadingTransactions ? (
                        <p className="text-sm text-[#6b7280]">Loading activity…</p>
                    ) : transactions.length === 0 ? (
                        <p className="rounded-2xl bg-[#f8fafb] px-4 py-8 text-center text-sm text-[#6b7280]">
                            No transactions yet. Add money or send to someone to get started.
                        </p>
                    ) : (
                        <ul className="divide-y divide-[#eef2f5]">
                            {transactions.map((transaction) => {
                                const isCredit = transaction.signedAmount >= 0;

                                return (
                                    <li
                                        key={transaction.id}
                                        className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-bold text-[#0f1419]">
                                                {transactionLabel(transaction)}
                                            </p>
                                            <p className="mt-0.5 text-xs text-[#6b7280]">
                                                {formatRelativeDate(transaction.createdAt)}
                                            </p>
                                        </div>
                                        <p
                                            className={`shrink-0 text-sm font-extrabold tracking-tight ${
                                                isCredit
                                                    ? "text-[#177245]"
                                                    : "text-[#0f1419]"
                                            }`}
                                        >
                                            {isCredit ? "+" : "−"}
                                            {formatInr(Math.abs(transaction.signedAmount))}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>

                {/* Upcoming Bills Widget — bottom right */}
                <UpcomingBills />
            </div>
        </div>
    );
}
