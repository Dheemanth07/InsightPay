import { useEffect, useMemo, useState } from "react";
import { getCategories } from "../../categories/categories.api";
import type { Category } from "../../categories/categories.types";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { Skeleton } from "../../../shared/components/Skeleton";
import {
    getTransactions,
    updateTransactionCategory,
} from "../transactions.api";
import type { Transaction } from "../transactions.types";
import { SplitBillModal } from "../components/SplitBillModal";

const MONTH_LABEL_OPTIONS: Intl.DateTimeFormatOptions = {
    month: "long",
    year: "numeric",
};

const MONTH_KEY_OPTIONS: Intl.DateTimeFormatOptions = {
    month: "2-digit",
    year: "numeric",
};

const groupTransactionsByMonth = (transactions: Transaction[]) => {
    return transactions.reduce(
        (groups, transaction) => {
            const date = new Date(transaction.createdAt);
            const monthKey = date.toLocaleDateString(
                "en-US",
                MONTH_KEY_OPTIONS,
            );
            const monthLabel = date.toLocaleDateString(
                "en-US",
                MONTH_LABEL_OPTIONS,
            );

            if (!groups[monthKey]) {
                groups[monthKey] = {
                    label: monthLabel,
                    transactions: [],
                };
            }

            groups[monthKey].transactions.push(transaction);
            return groups;
        },
        {} as Record<string, { label: string; transactions: Transaction[] }>,
    );
};

const transactionCounterparty = (transaction: Transaction) => {
    if (transaction.type === "DEPOSIT") {
        return "Self";
    }

    if (transaction.toUser?.name) {
        return transaction.toUser.name;
    }

    if (transaction.fromUser?.name) {
        return transaction.fromUser.name;
    }

    return "Unknown";
};

const formatTransactionDate = (transaction: Transaction) => {
    const date = new Date(transaction.createdAt);
    const day = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
    const time = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    return `${day}, ${time}`;
};

const filterOptionsFromTransactions = (transactions: Transaction[]) => {
    const months = new Set<string>();
    const categories = new Set<string>();
    const statuses = new Set<string>();
    const types = new Set<string>();

    transactions.forEach((transaction) => {
        const date = new Date(transaction.createdAt);
        months.add(date.toLocaleDateString("en-US", MONTH_KEY_OPTIONS));
        if (transaction.category?.name) {
            categories.add(transaction.category.name);
        }
        statuses.add(transaction.status);
        types.add(transaction.type);
    });

    return {
        months: Array.from(months).sort((a, b) => (a > b ? -1 : 1)),
        categories: Array.from(categories).sort(),
        statuses: Array.from(statuses).sort(),
        types: Array.from(types).sort(),
    };
};

export function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categoryError, setCategoryError] = useState("");
    const [updatingCategoryId, setUpdatingCategoryId] = useState<number | null>(
        null,
    );
    const [splitTransaction, setSplitTransaction] = useState<Transaction | null>(null);
    const [search, setSearch] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const [transactionResponse, categoryResponse] =
                    await Promise.all([getTransactions(), getCategories()]);
                const normalized = (transactionResponse.data || []).map(
                    (transaction) => ({
                        ...transaction,
                        amount: Number(transaction.amount) || 0,
                    }),
                );
                setTransactions(normalized);
                setCategories(categoryResponse.data || []);
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

    const filters = useMemo(
        () => filterOptionsFromTransactions(transactions),
        [transactions],
    );

    const filteredTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            const text =
                `${transaction.type} ${transaction.status} ${transaction.category?.name || ""} ${transaction.toUser?.name || transaction.fromUser?.name || ""}`.toLowerCase();
            const searchMatch = text.includes(search.toLowerCase());

            const monthMatch =
                selectedMonths.length === 0 ||
                selectedMonths.includes(
                    new Date(transaction.createdAt).toLocaleDateString(
                        "en-US",
                        MONTH_KEY_OPTIONS,
                    ),
                );
            const categoryMatch =
                selectedCategories.length === 0 ||
                selectedCategories.includes(transaction.category?.name || "");
            const statusMatch =
                selectedStatuses.length === 0 ||
                selectedStatuses.includes(transaction.status);
            const typeMatch =
                selectedTypes.length === 0 ||
                selectedTypes.includes(transaction.type);

            return (
                searchMatch &&
                monthMatch &&
                categoryMatch &&
                statusMatch &&
                typeMatch
            );
        });
    }, [
        transactions,
        search,
        selectedMonths,
        selectedCategories,
        selectedStatuses,
        selectedTypes,
    ]);

    const grouped = useMemo(
        () => groupTransactionsByMonth(filteredTransactions),
        [filteredTransactions],
    );

    const monthLabels = useMemo(
        () => Object.keys(grouped).sort((a, b) => (a > b ? -1 : 1)),
        [grouped],
    );

    const clearFilters = () => {
        setSelectedMonths([]);
        setSelectedCategories([]);
        setSelectedStatuses([]);
        setSelectedTypes([]);
    };

    const handleCategoryChange = async (
        transaction: Transaction,
        categoryId: string,
    ) => {
        const selectedCategory = categories.find(
            (category) => category.id === categoryId,
        );

        if (!selectedCategory) return;

        setUpdatingCategoryId(transaction.id);
        setCategoryError("");

        try {
            await updateTransactionCategory(transaction.id, categoryId);
            setTransactions((currentTransactions) =>
                currentTransactions.map((currentTransaction) =>
                    currentTransaction.id === transaction.id
                        ? {
                              ...currentTransaction,
                              categoryId,
                              category: {
                                  id: selectedCategory.id,
                                  name: selectedCategory.name,
                                  type: selectedCategory.type,
                              },
                          }
                        : currentTransaction,
                ),
            );
        } catch (err) {
            setCategoryError(
                getApiErrorMessage(err, "Failed to update category"),
            );
        } finally {
            setUpdatingCategoryId(null);
        }
    };

    if (loading) {
        return (
            <main className="app-page">
                <header className="page-header">
                    <div>
                        <Skeleton width="w-16" height="h-3.5" rounded="rounded-md" className="mb-2" />
                        <Skeleton width="w-48" height="h-8" rounded="rounded-lg" />
                    </div>
                </header>

                <section className="panel transaction-toolbar flex items-center justify-between gap-4">
                    <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                    <Skeleton width="w-24" height="h-10" rounded="rounded-lg" />
                </section>

                <div className="space-y-8">
                    {Array.from({ length: 2 }).map((_, monthIdx) => (
                        <div key={monthIdx} className="space-y-4">
                            <div className="flex items-center justify-between border-b border-[#edf1f3] pb-3">
                                <div className="space-y-2">
                                    <Skeleton width="w-32" height="h-6" rounded="rounded-md" />
                                    <Skeleton width="w-48" height="h-4" rounded="rounded-md" />
                                </div>
                            </div>
                            <div className="transaction-list space-y-4">
                                {Array.from({ length: 3 }).map((_, itemIdx) => (
                                    <div key={itemIdx} className="transaction-row flex items-center justify-between p-4 border border-[#edf1f3] rounded-2xl bg-[#fafbfc]">
                                        <div className="space-y-3 flex-1 pr-4">
                                            <Skeleton width="w-24" height="h-4" rounded="rounded-md" />
                                            <div className="flex items-center gap-2">
                                                <Skeleton width="w-16" height="h-3" rounded="rounded-md" />
                                                <Skeleton width="w-16" height="h-5" rounded="rounded-full" />
                                            </div>
                                            <Skeleton width="w-32" height="h-3" rounded="rounded-md" />
                                        </div>
                                        <Skeleton width="w-20" height="h-6" rounded="rounded-md" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        );
    }

    if (error) {
        return <p className="page-status error-text">{error}</p>;
    }

    return (
        <main className="app-page">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Transactions</p>
                    <h1>Transaction history</h1>
                </div>
            </header>

            <section className="panel transaction-toolbar">
                <div className="search-container">
                    <svg
                        className="search-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        focusable="false"
                    >
                        <circle cx="11" cy="11" r="7" />
                        <path d="m16.5 16.5 4.5 4.5" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search transactions"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />
                </div>
                <button
                    type="button"
                    className="secondary-button filter-button"
                    onClick={() => setFilterOpen(true)}
                >
                    Filter
                </button>
            </section>

            {categoryError && <p className="error-text">{categoryError}</p>}

            {filterOpen && (
                <div
                    className="filter-panel-overlay"
                    onClick={() => setFilterOpen(false)}
                >
                    <div
                        className="filter-panel"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="filter-header">
                            <h2>Filter</h2>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setFilterOpen(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="filter-section">
                            <h3>Month</h3>
                            <div className="filter-options">
                                {filters.months.map((monthKey) => {
                                    const [month, year] = monthKey.split("/");
                                    const label = new Date(
                                        `${year}-${month}-01`,
                                    ).toLocaleDateString(
                                        "en-US",
                                        MONTH_LABEL_OPTIONS,
                                    );
                                    return (
                                        <label
                                            key={monthKey}
                                            className="filter-label"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedMonths.includes(
                                                    monthKey,
                                                )}
                                                onChange={() => {
                                                    setSelectedMonths(
                                                        (current) =>
                                                            current.includes(
                                                                monthKey,
                                                            )
                                                                ? current.filter(
                                                                      (item) =>
                                                                          item !==
                                                                          monthKey,
                                                                  )
                                                                : [
                                                                      ...current,
                                                                      monthKey,
                                                                  ],
                                                    );
                                                }}
                                            />
                                            {label}
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3>Category</h3>
                            <div className="filter-options">
                                {filters.categories.map((category) => (
                                    <label
                                        key={category}
                                        className="filter-label"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(
                                                category,
                                            )}
                                            onChange={() => {
                                                setSelectedCategories(
                                                    (current) =>
                                                        current.includes(
                                                            category,
                                                        )
                                                            ? current.filter(
                                                                  (item) =>
                                                                      item !==
                                                                      category,
                                                              )
                                                            : [
                                                                  ...current,
                                                                  category,
                                                              ],
                                                );
                                            }}
                                        />
                                        {category}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3>Status</h3>
                            <div className="filter-options">
                                {filters.statuses.map((status) => (
                                    <label
                                        key={status}
                                        className="filter-label"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedStatuses.includes(
                                                status,
                                            )}
                                            onChange={() => {
                                                setSelectedStatuses(
                                                    (current) =>
                                                        current.includes(status)
                                                            ? current.filter(
                                                                  (item) =>
                                                                      item !==
                                                                      status,
                                                              )
                                                            : [
                                                                  ...current,
                                                                  status,
                                                              ],
                                                );
                                            }}
                                        />
                                        {status}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-section">
                            <h3>Type</h3>
                            <div className="filter-options">
                                {filters.types.map((type) => (
                                    <label key={type} className="filter-label">
                                        <input
                                            type="checkbox"
                                            checked={selectedTypes.includes(
                                                type,
                                            )}
                                            onChange={() => {
                                                setSelectedTypes((current) =>
                                                    current.includes(type)
                                                        ? current.filter(
                                                              (item) =>
                                                                  item !== type,
                                                          )
                                                        : [...current, type],
                                                );
                                            }}
                                        />
                                        {type}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="filter-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={clearFilters}
                            >
                                Clear all
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterOpen(false)}
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {monthLabels.length === 0 ? (
                <section className="panel">
                    <p className="empty-state">
                        No transactions match your search or filters.
                    </p>
                </section>
            ) : (
                monthLabels.map((monthKey) => {
                    const group = grouped[monthKey];
                    const monthTotal = group.transactions.reduce(
                        (sum, transaction) => sum + transaction.amount,
                        0,
                    );
                    return (
                        <section className="panel month-group" key={monthKey}>
                            <div className="month-group-header">
                                <div className="group-header">
                                    <p className="group-label">{group.label}</p>
                                    <p className="group-subtitle">
                                        Total expenditure: INR {monthTotal.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="transaction-list">
                                {group.transactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="transaction-row"
                                    >
                                        <div>
                                            <p className="transaction-title">
                                                {transaction.type} - {transaction.status}
                                            </p>
                                            <p className="transaction-meta">
                                                {transaction.type === "DEPOSIT" ? (
                                                    <span className="transaction-counterparty">
                                                        To: <strong>Self</strong>
                                                    </span>
                                                ) : (
                                                    <span className="transaction-counterparty">
                                                        To: <strong>
                                                            {transactionCounterparty(
                                                                transaction,
                                                            )}
                                                        </strong>
                                                    </span>
                                                )}
                                                <span className="category-pill">
                                                    {transaction.category?.name ||
                                                        "Uncategorized"}
                                                </span>
                                            </p>
                                            <p className="transaction-date">
                                                {formatTransactionDate(transaction)}
                                            </p>
                                            {transaction.status === "SUCCESS" && (
                                                <label className="category-select-label">
                                                    Category
                                                    <select
                                                        className="transaction-category-select"
                                                        value={
                                                            transaction.categoryId ||
                                                            transaction.category?.id ||
                                                            ""
                                                        }
                                                        onChange={(event) =>
                                                            handleCategoryChange(
                                                                transaction,
                                                                event.target.value,
                                                            )
                                                        }
                                                        disabled={
                                                            updatingCategoryId ===
                                                            transaction.id
                                                        }
                                                    >
                                                        <option value="" disabled>
                                                            Choose category
                                                        </option>
                                                        {categories.map(
                                                            (category) => (
                                                                <option
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    value={
                                                                        category.id
                                                                    }
                                                                >
                                                                    {
                                                                        category.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </label>
                                            )}
                                            {transaction.status === "SUCCESS" && transaction.type !== "DEPOSIT" && (
                                                <button
                                                    type="button"
                                                    className="secondary-button"
                                                    onClick={() => setSplitTransaction(transaction)}
                                                    style={{ 
                                                        marginTop: "0.75rem", 
                                                        padding: "0.45rem 1rem", 
                                                        fontSize: "0.8rem", 
                                                        borderRadius: "999px",
                                                        display: "block",
                                                        width: "fit-content"
                                                    }}
                                                >
                                                    Split this bill
                                                </button>
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
                                            INR {Math.abs(transaction.amount).toFixed(
                                                2,
                                            )}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        </section>
                    );
                })
            )}

            {splitTransaction && (
                <SplitBillModal
                    transaction={splitTransaction}
                    onClose={() => setSplitTransaction(null)}
                />
            )}
        </main>
    );
}
