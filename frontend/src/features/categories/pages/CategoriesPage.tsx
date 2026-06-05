import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import {
    createCategory,
    deleteCategory,
    getCategories,
} from "../categories.api";
import type { Category } from "../categories.types";

export function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const [categoryType, setCategoryType] = useState("EXPENSE");
    const [processing, setProcessing] = useState(false);

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

    const handleDeleteCategory = async (categoryId: string) => {
        if (!confirm("Are you sure you want to delete this category?")) {
            return;
        }

        setProcessing(true);
        setError("");

        try {
            await deleteCategory(categoryId);
            await fetchCategories();
        } catch (err) {
            setError(
                getApiErrorMessage(err, "Failed to delete category"),
            );
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <p className="page-status">Loading categories...</p>;
    }

    return (
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
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className="category-card"
                            >
                                <div>
                                    <p className="category-card-title">
                                        {category.name}
                                    </p>
                                </div>
                                {!category.isSystem && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleDeleteCategory(
                                                category.id,
                                            )
                                        }
                                        disabled={processing}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
