import { useEffect, useMemo, useState, useRef } from "react";
import { getCategories } from "../../categories/categories.api";
import type { Category } from "../../categories/categories.types";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { Skeleton } from "../../../shared/components/Skeleton";
import {
    updateTransactionCategory,
} from "../transactions.api";
import { getWalletTransactions } from "../../wallet/wallet.api";
import type { Transaction } from "../transactions.types";
import { SplitBillModal } from "../components/SplitBillModal";
import { suggestCategory } from "../../dashboard/dashboard.api";


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

    // Cursor Pagination States
    const [cursorStack, setCursorStack] = useState<(number | null)[]>([null]);
    const [pageIndex, setPageIndex] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);
    const [nextCursor, setNextCursor] = useState<number | null>(null);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                setLoading(true);
                const currentCursor = cursorStack[pageIndex];
                const [walletRes, categoryResponse] = await Promise.all([
                    getWalletTransactions(currentCursor, limit),
                    getCategories(),
                ]);

                const rawTransactions = (walletRes.data.result?.transactions || []) as any[];
                setNextCursor(walletRes.data.result?.nextCursor ?? null);

                const normalized = rawTransactions.map((transaction) => ({
                    ...transaction,
                    amount: Number(transaction.amount) || 0,
                }));

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

        void fetchTransactions();
    }, [pageIndex, limit, cursorStack]);

    const handleNextPage = () => {
        if (!nextCursor) return;
        const newStack = [...cursorStack];
        newStack[pageIndex + 1] = nextCursor;
        setCursorStack(newStack);
        setPageIndex((prev) => prev + 1);
    };

    const handlePreviousPage = () => {
        if (pageIndex > 0) {
            setPageIndex((prev) => prev - 1);
        }
    };

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


// ─── AI Category Suggestion Chip ───────────────────────────────────────────────────
function CategorySuggestionChip({
    description,
    categories,
    onAccept,
}: {
    description: string;
    categories: Category[];
    onAccept: (categoryId: string) => void;
}) {
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!description || description.length < 3) { setSuggestion(null); return; }
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            try {
                const catNames = categories.filter(c => c.type === "EXPENSE").map(c => c.name);
                if (catNames.length === 0) return;
                const res = await suggestCategory(description, catNames);
                setSuggestion(res.data.suggestion ?? null);
            } catch { setSuggestion(null); }
        }, 600);
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [description, categories]);

    if (!suggestion) return null;

    const matchedCat = categories.find(c => c.name === suggestion);
    if (!matchedCat) return null;

    return (
        <button
            type="button"
            onClick={() => onAccept(matchedCat.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 mt-1.5 rounded-full text-xs font-bold bg-[#e8f5f3] text-[#0d6b5f] border border-[#b8dbd7] hover:bg-[#0d6b5f] hover:text-white transition-colors cursor-pointer"
            title="Click to apply this suggested category"
        >
            Suggested: {suggestion}
        </button>
    );
}

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
                    className="secondary-button filter-button flex items-center justify-center gap-2"
                    onClick={() => setFilterOpen(true)}
                >
                    <span>Filter</span>
                    {(selectedMonths.length + selectedCategories.length + selectedStatuses.length + selectedTypes.length) > 0 && (
                        <span className="filter-count-badge">
                            {selectedMonths.length + selectedCategories.length + selectedStatuses.length + selectedTypes.length}
                        </span>
                    )}
                </button>
            </section>

            {categoryError && <p className="error-text">{categoryError}</p>}

            {filterOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ backgroundColor: "rgba(15, 23, 42, 0.45)", backdropFilter: "blur(6px)" }}
                    onClick={() => setFilterOpen(false)}
                >
                    <div
                        className="bg-white rounded-[28px] border border-[#e8ecf0] shadow-2xl max-w-lg w-full p-6 sm:p-7 max-h-[85vh] flex flex-col justify-between overflow-hidden"
                        onClick={(event) => event.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-[#eef2f5] mb-5">
                            <div>
                                <h2 className="text-xl font-extrabold tracking-tight text-[#0f1419]">Filter Transactions</h2>
                                <p className="text-xs text-[#6b7280] mt-0.5">Narrow down by period, status, or category</p>
                            </div>
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setFilterOpen(false)}
                            >
                                Close
                            </button>
                        </div>

                        {/* Modal Body: Compact Multi-Section Grid */}
                        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-left">
                            {/* Row 1: Month & Status side by side */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Month Section */}
                                <div>
                                    <p className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider mb-2">Month</p>
                                    <div className="flex flex-wrap gap-2">
                                        {filters.months.map((monthKey) => {
                                            const [month, year] = monthKey.split("/");
                                            const label = new Date(`${year}-${month}-01`).toLocaleDateString("en-US", MONTH_LABEL_OPTIONS);
                                            const isSelected = selectedMonths.includes(monthKey);

                                            return (
                                                <button
                                                    key={monthKey}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedMonths((current) =>
                                                            current.includes(monthKey)
                                                                ? current.filter((item) => item !== monthKey)
                                                                : [...current, monthKey]
                                                        );
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "bg-[#0d6b5f] text-white border border-[#0d6b5f] shadow-sm font-bold"
                                                            : "bg-[#f8fafb] text-[#475569] border border-[#e2e8f0] hover:bg-[#f1f5f9]"
                                                    }`}
                                                >
                                                    {label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Status Section */}
                                <div>
                                    <p className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider mb-2">Status</p>
                                    <div className="flex flex-wrap gap-2">
                                        {filters.statuses.map((status) => {
                                            const isSelected = selectedStatuses.includes(status);

                                            return (
                                                <button
                                                    key={status}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStatuses((current) =>
                                                            current.includes(status)
                                                                ? current.filter((item) => item !== status)
                                                                : [...current, status]
                                                        );
                                                    }}
                                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                                        isSelected
                                                            ? "bg-[#0d6b5f] text-white border border-[#0d6b5f] shadow-sm font-bold"
                                                            : "bg-[#f8fafb] text-[#475569] border border-[#e2e8f0] hover:bg-[#f1f5f9]"
                                                    }`}
                                                >
                                                    {status}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: Type */}
                            <div>
                                <p className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider mb-2">Transaction Type</p>
                                <div className="flex flex-wrap gap-2">
                                    {filters.types.map((type) => {
                                        const isSelected = selectedTypes.includes(type);

                                        return (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedTypes((current) =>
                                                        current.includes(type)
                                                            ? current.filter((item) => item !== type)
                                                            : [...current, type]
                                                    );
                                                }}
                                                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-[#0d6b5f] text-white border border-[#0d6b5f] shadow-sm font-bold"
                                                        : "bg-[#f8fafb] text-[#475569] border border-[#e2e8f0] hover:bg-[#f1f5f9]"
                                                }`}
                                            >
                                                {type}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Section 3: Category */}
                            <div>
                                <p className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider mb-2">Category</p>
                                <div className="flex flex-wrap gap-2">
                                    {filters.categories.map((category) => {
                                        const isSelected = selectedCategories.includes(category);

                                        return (
                                            <button
                                                key={category}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCategories((current) =>
                                                        current.includes(category)
                                                            ? current.filter((item) => item !== category)
                                                            : [...current, category]
                                                    );
                                                }}
                                                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-[#0d6b5f] text-white border border-[#0d6b5f] shadow-sm font-bold"
                                                        : "bg-[#f8fafb] text-[#475569] border border-[#e2e8f0] hover:bg-[#f1f5f9]"
                                                }`}
                                            >
                                                {category}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="flex items-center justify-between pt-4 border-t border-[#eef2f5] mt-5">
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="px-4 py-2 rounded-full text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition cursor-pointer border-0"
                            >
                                Clear all
                            </button>
                            <button
                                type="button"
                                onClick={() => setFilterOpen(false)}
                                className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#0d6b5f] hover:bg-[#094d45] transition cursor-pointer shadow-sm border-0"
                            >
                                Apply Filters
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
                                        Total expenditure: ₹{monthTotal.toFixed(2)}
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
                                            {transaction.status === "SUCCESS" &&
                                                transaction.type !== "DEPOSIT" &&
                                                !transaction.category && (
                                                <CategorySuggestionChip
                                                    description={`${transaction.type} to ${transactionCounterparty(transaction)}`}
                                                    categories={categories}
                                                    onAccept={(categoryId) =>
                                                        handleCategoryChange(transaction, categoryId)
                                                    }
                                                />
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
                                                ? "+ "
                                                : "- "}
                                            ₹{Math.abs(transaction.amount).toFixed(
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

            {/* Industry-Standard Cursor Pagination Bar */}
            <div className="mt-8 p-4 rounded-3xl border border-[#e8ecf0] bg-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div className="text-xs font-semibold text-[#64748b]">
                    Showing <strong className="text-[#0f1419]">Page {pageIndex + 1}</strong>
                    {nextCursor && <span className="ml-1 font-normal text-[#94a3b8]">(More transactions available)</span>}
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                    <span className="whitespace-nowrap">Rows per page:</span>
                    <select
                        value={limit}
                        onChange={(e) => {
                            const newLimit = Number(e.target.value);
                            setLimit(newLimit);
                            setPageIndex(0);
                            setCursorStack([null]);
                        }}
                        className="pagination-limit-select rounded-full border border-[#d7dee5] bg-[#f8fafb] text-xs font-bold text-[#0f1419] outline-none cursor-pointer hover:bg-white transition"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                    </select>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        disabled={pageIndex === 0 || loading}
                        onClick={handlePreviousPage}
                        className="px-4 py-1.5 rounded-full border border-[#d7dee5] bg-[#f8fafb] text-xs font-bold text-[#0f1419] hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                        ← Previous
                    </button>
                    <button
                        type="button"
                        disabled={!nextCursor || loading}
                        onClick={handleNextPage}
                        className="px-4 py-1.5 rounded-full bg-[#0d6b5f] text-white text-xs font-bold hover:bg-[#094d45] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-sm border-0"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {splitTransaction && (
                <SplitBillModal
                    transaction={splitTransaction}
                    onClose={() => setSplitTransaction(null)}
                />
            )}
        </main>
    );
}
