import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { getTransactions } from "../transactions.api";
import type { Transaction } from "../transactions.types";

export function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const response = await getTransactions();
                setTransactions(response.data || []);
            } catch (err) {
                setError(
                    getApiErrorMessage(
                        err,
                        "Failed to load transactions. Please try again later.",
                    ),
                );
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    if (loading) {
        return <p className="page-status">Loading transactions...</p>;
    }

    if (error) {
        return <p className="page-status error-text">{error}</p>;
    }

    return (
        <main className="app-page">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Transactions</p>
                    <h1>All Transactions</h1>
                </div>
            </header>

            <section className="panel">
                {transactions.length === 0 ? (
                    <p className="empty-state">No transactions yet.</p>
                ) : (
                    <div className="transaction-list">
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="transaction-row"
                            >
                                <div>
                                    <p>
                                        {transaction.type} -{" "}
                                        {transaction.status}
                                    </p>
                                    {transaction.category && (
                                        <p className="muted-panel">
                                            {transaction.category.name}
                                        </p>
                                    )}
                                </div>
                                <strong
                                    className={
                                        transaction.type === "DEPOSIT"
                                            ? "amount-positive"
                                            : "amount-negative"
                                    }
                                >
                                    {transaction.type === "DEPOSIT"
                                        ? "+"
                                        : "-"}
                                    INR {transaction.amount.toFixed(2)}
                                </strong>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
