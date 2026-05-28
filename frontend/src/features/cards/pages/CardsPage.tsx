import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { addCard, deleteCard, getCards } from "../cards.api";
import type { Card } from "../cards.types";

export function CardsPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardholderName, setCardholderName] = useState("");
    const [expiryDate, setExpiryDate] = useState("");
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
        if (!cardNumber.trim() || !cardholderName.trim() || !expiryDate.trim()) {
            setError("All card details are required");
            return;
        }

        setProcessing(true);
        setError("");

        try {
            await addCard({
                cardNumber,
                cardholderName,
                expiryDate,
            });
            setCardNumber("");
            setCardholderName("");
            setExpiryDate("");
            await fetchCards();
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to add card"));
        } finally {
            setProcessing(false);
        }
    };

    const handleDeleteCard = async (cardId: number) => {
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
                    Cardholder Name
                    <input
                        type="text"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value)}
                        placeholder="John Doe"
                    />
                </label>
                <label>
                    Expiry Date
                    <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                    />
                </label>
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
                            <div
                                key={card.id}
                                className="transaction-row"
                            >
                                <div>
                                    <p>{card.cardholderName}</p>
                                    <p className="muted-panel">
                                        ••••{" "}
                                        {card.cardNumber.slice(-4)}{" "}
                                        | {card.expiryDate}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleDeleteCard(card.id)
                                    }
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
