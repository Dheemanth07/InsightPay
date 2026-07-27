import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategoryBudgetApi,
} from "../categories.api";
import type { Category } from "../categories.types";
import { ConfirmationModal } from "../../../shared/components/ConfirmationModal";
import { Skeleton } from "../../../shared/components/Skeleton";
import { getCategoryTrends } from "../../dashboard/dashboard.api";

type Trend = { category: string; direction: string; percent: number | null; label: string };


export function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [categoryType, setCategoryType] = useState("EXPENSE");
    const [processing, setProcessing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
    const [trends, setTrends] = useState<Trend[]>([]);
    const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
    const [budgetInput, setBudgetInput] = useState("");

    const handleSaveBudget = async (categoryId: string) => {
        const numericBudget = budgetInput.trim() ? Number(budgetInput) : null;
        if (numericBudget !== null && (isNaN(numericBudget) || numericBudget < 0)) {
            setError("Please enter a valid positive budget amount");
            return;
        }

        try {
            setProcessing(true);
            await updateCategoryBudgetApi(categoryId, numericBudget);
            setEditingBudgetId(null);
            await fetchCategories();
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to update category budget"));
        } finally {
            setProcessing(false);
        }
    };


    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getCategories();
            setCategories(response.data || []);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Failed to load categories. Please try again later.",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
        // Fetch trends independently — silent on error
        getCategoryTrends()
            .then(res => setTrends(res.data.trends || []))
            .catch(() => { });
    }, [fetchCategories]);


    const handleCreateCategory = async () => {
        if (!categoryName.trim()) {
            setError("Category name is required");
            return;
        }

        setProcessing(true);
        setError("");

        try {
            await createCategory({
                name: categoryName,
                type: categoryType,
            });
            setCategoryName("");
            await fetchCategories();
        } catch (err) {
            setError(
                getApiErrorMessage(err, "Failed to create category"),
            );
        } finally {
            setProcessing(false);
        }
    };

    const requestDeleteCategory = (categoryId: string) => {
        setCategoryToDelete(categoryId);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteCategory = async () => {
        if (!categoryToDelete) return;

        setIsDeleteModalOpen(false);
        setProcessing(true);
        setError("");

        try {
            await deleteCategory(categoryToDelete);
            await fetchCategories();
        } catch (err) {
            setError(
                getApiErrorMessage(err, "Failed to delete category"),
            );
        } finally {
            setProcessing(false);
            setCategoryToDelete(null);
        }
    };

    const cancelDeleteCategory = () => {
        setIsDeleteModalOpen(false);
        setCategoryToDelete(null);
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

                <section className="panel space-y-4">
                    <Skeleton width="w-40" height="h-6" rounded="rounded-md" />
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Skeleton width="w-24" height="h-3.5" rounded="rounded-md" />
                            <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton width="w-16" height="h-3.5" rounded="rounded-md" />
                            <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                        </div>
                    </div>
                    <Skeleton width="w-36" height="h-12" rounded="rounded-lg" />
                </section>

                <section className="panel space-y-4">
                    <Skeleton width="w-32" height="h-6" rounded="rounded-md" />
                    <div className="category-grid">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="category-card flex items-center justify-between p-4 border border-[#e8ecf0] rounded-2xl">
                                <Skeleton width="w-24" height="h-4" rounded="rounded-md" />
                                {i % 2 === 0 && <Skeleton width="w-14" height="h-8" rounded="rounded-lg" />}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        );
    }

    return (
        <>
            <main className="app-page">
                <header className="page-header">
                    <div>
                        <p className="eyebrow">Categories</p>
                        <h1>Manage Categories</h1>
                    </div>
                </header>

                {error && <p className="error-text">{error}</p>}

                <section className="panel">
                    <h2>Create New Category</h2>
                    <label>
                        Category Name
                        <input
                            type="text"
                            value={categoryName}
                            onChange={(e) => setCategoryName(e.target.value)}
                            placeholder="e.g., Groceries, Travel"
                        />
                    </label>
                    <label>
                        Type
                        <select
                            value={categoryType}
                            onChange={(e) => setCategoryType(e.target.value)}
                        >
                            <option value="EXPENSE">Expense</option>
                            <option value="INCOME">Income</option>
                        </select>
                    </label>
                    <button
                        type="button"
                        onClick={handleCreateCategory}
                        disabled={processing}
                    >
                        {processing ? "Creating..." : "Create Category"}
                    </button>
                </section>

                <section className="panel">
                    <h2>Your Categories</h2>
                    {categories.length === 0 ? (
                        <p className="empty-state">No categories yet.</p>
                    ) : (
                        <div className="category-grid">
                            {categories.map((category) => {
                                const trend = trends.find(t => t.category === category.name);
                                const budget = category.monthlyBudget ? Number(category.monthlyBudget) : null;
                                const isEditingBudget = editingBudgetId === category.id;

                                return (
                                    <div
                                        key={category.id}
                                        className="category-card flex flex-col justify-between p-4 bg-white border border-[#e6eaee] rounded-2xl shadow-sm hover:shadow-md transition-all space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="category-card-title text-base font-extrabold text-[#0f1419]">
                                                    {category.name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                                                        {category.type}
                                                    </span>
                                                    {trend && (
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${trend.direction === "up"
                                                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                                : trend.direction === "down"
                                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                    : "bg-gray-100 text-gray-600"
                                                            }`}>
                                                            {trend.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {!category.isSystem && (
                                                <button
                                                    type="button"
                                                    onClick={() => requestDeleteCategory(category.id)}
                                                    disabled={processing}
                                                    className="text-xs font-semibold text-red-500 hover:text-red-700 transition"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>

                                        {/* Monthly Budget Section */}
                                        <div className="pt-3 border-t border-gray-100 space-y-2">
                                            {isEditingBudget ? (
                                                <div className="space-y-2 bg-[#f8fafb] p-3 rounded-xl border border-[#e6eaee]">
                                                    <label className="text-[11px] font-bold text-[#64748b] block text-left">
                                                        Set Target Monthly Budget
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative flex-1 flex items-center">
                                                            <span className="absolute left-2.5 text-xs font-bold text-gray-400 select-none">₹</span>
                                                            <input
                                                                type="number"
                                                                value={budgetInput}
                                                                onChange={(e) => setBudgetInput(e.target.value)}
                                                                placeholder="e.g. 500"
                                                                className="w-full h-9 pl-6 pr-2 border border-[#0d6b5f] rounded-lg text-xs font-bold text-[#0f1419] bg-white outline-none m-0! shadow-2xs"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <span
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => handleSaveBudget(category.id)}
                                                            className="h-9 px-3.5 inline-flex items-center justify-center rounded-lg text-xs font-bold text-white bg-[#0d6b5f] hover:bg-[#094d45] transition cursor-pointer select-none m-0!"
                                                        >
                                                            Save
                                                        </span>
                                                        <span
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => setEditingBudgetId(null)}
                                                            className="h-9 px-2.5 inline-flex items-center justify-center text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer select-none m-0!"
                                                        >
                                                            Cancel
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-[#64748b] font-semibold">Monthly Limit:</span>
                                                    {budget ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-extrabold text-[#0f1419]">
                                                                ₹{budget.toLocaleString("en-IN")}
                                                            </span>
                                                            <span
                                                                role="button"
                                                                tabIndex={0}
                                                                onClick={() => {
                                                                    setEditingBudgetId(category.id);
                                                                    setBudgetInput(String(budget));
                                                                }}
                                                                className="text-[11px] font-bold text-[#0d6b5f] hover:underline cursor-pointer select-none"
                                                            >
                                                                Edit
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={() => {
                                                                setEditingBudgetId(category.id);
                                                                setBudgetInput("");
                                                            }}
                                                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-[#0d6b5f] bg-[#e8f5f3] border border-[#b8dbd7] hover:bg-[#0d6b5f] hover:text-white transition cursor-pointer select-none"
                                                        >
                                                            + Set Budget
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {budget && budget > 0 && !isEditingBudget && (
                                                <div className="space-y-1 pt-1">
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#0d6b5f] rounded-full transition-all duration-300"
                                                            style={{ width: "40%" }}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-emerald-700 font-bold text-right">
                                                        Active Target Limit
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={cancelDeleteCategory}
                onConfirm={handleDeleteCategory}
                title="Delete Category?"
                description="Are you sure you want to delete this category? This action cannot be undone."
                confirmText="Delete Category"
                isProcessing={processing}
            />
        </>
    );
}
