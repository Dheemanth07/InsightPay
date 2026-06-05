import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { addCard, deleteCard, getCards } from "../cards.api";
import type { Card } from "../cards.types";

export function CardsPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [brand, setBrand] = useState("");
    const [expiryMonth, setExpiryMonth] = useState("");
    const [expiryYear, setExpiryYear] = useState("");
    const [processing, setProcessing] = useState(false);

    const fetchCards = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getCards();
            setCards(response.data.cards || []);
        } catch (err) {
            setError(
                getApiErrorMessage(
                    err,
                    "Failed to load cards. Please try again later.",
                ),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCards();
    }, [fetchCards]);

    const handleAddCard = async () => {
        if (
            !cardNumber.trim() ||
            !brand.trim() ||
            !expiryMonth.trim() ||
            !expiryYear.trim()
        ) {
            setError("All card details are required");
            return;
        }

        const expiryMonthNumber = Number(expiryMonth);
        const expiryYearNumber = Number(expiryYear);

        if (
            Number.isNaN(expiryMonthNumber) ||
            Number.isNaN(expiryYearNumber) ||
            expiryMonthNumber < 1 ||
            expiryMonthNumber > 12 ||
            expiryYearNumber < 2024
        ) {
            setError("Enter a valid expiry month and year");
            return;
        }

        setProcessing(true);
        setError("");

        try {
            await addCard({
                cardNumber,
                brand,
                expiryMonth: expiryMonthNumber,
                expiryYear: expiryYearNumber,
            });
            setCardNumber("");
            setBrand("");
            setExpiryMonth("");
            setExpiryYear("");
            await fetchCards();
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to add card"));
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteCard = async (cardId: string) => {
        if (!confirm("Are you sure you want to delete this card?")) {
            return;
        }

        setProcessing(true);
        setError("");

        try {
            await deleteCard(cardId);
            await fetchCards();
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to delete card"));
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <p className="page-status">Loading cards...</p>;
    }

    return (
        <main className="app-page">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Cards</p>
                    <h1>Manage Payment Cards</h1>
                </div>
            </header>

            {error && <p className="error-text">{error}</p>}

            <section className="panel">
                <h2>Add New Card</h2>
                <label>
                    Card Number
                    <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                    />
                </label>
                <label>
                    Card Brand
                    <input
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="Visa, Mastercard, etc."
                    />
                </label>
                <div className="wallet-actions-row">
                    <label>
                        Expiry Month
                        <input
                            type="number"
                            min="1"
                            max="12"
                            value={expiryMonth}
                            onChange={(e) => setExpiryMonth(e.target.value)}
                            placeholder="MM"
                        />
                    </label>
                    <label>
                        Expiry Year
                        <input
                            type="number"
                            min="2024"
                            value={expiryYear}
                            onChange={(e) => setExpiryYear(e.target.value)}
                            placeholder="YYYY"
                        />
                    </label>
                </div>
                <button
                    type="button"
                    onClick={handleAddCard}
                    disabled={processing}
                >
                    {processing ? "Adding..." : "Add Card"}
                </button>
            </section>

            <section className="panel">
                <h2>Your Cards</h2>
                {cards.length === 0 ? (
                    <p className="empty-state">No cards added yet.</p>
                ) : (
                    <div className="transaction-list">
                        {cards.map((card) => (
                            <div key={card.id} className="transaction-row">
                                <div>
                                    <p>{card.brand}</p>
                                    <p className="muted-panel">
                                        •••• {card.last4} | {card.expiryMonth}/
                                        {card.expiryYear}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteCard(card.id)}
                                    disabled={processing}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
