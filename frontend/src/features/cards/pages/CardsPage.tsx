import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { addCard, deleteCard, getCards } from "../cards.api";
import { CreditCard } from "../components/CreditCard";
import type { Card } from "../cards.types";
import { ConfirmationModal } from "../../../shared/components/ConfirmationModal";

export function CardsPage() {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [brand, setBrand] = useState("");
    const [issuerBank, setIssuerBank] = useState("");
    const [expiryMonth, setExpiryMonth] = useState("");
    const [expiryYear, setExpiryYear] = useState("");
    const [processing, setProcessing] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [cardToDelete, setCardToDelete] = useState<string | null>(null);

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
            !issuerBank.trim() ||
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
                issuerBank,
                expiryMonth: expiryMonthNumber,
                expiryYear: expiryYearNumber,
            });
            setCardNumber("");
            setBrand("");
            setIssuerBank("");
            setExpiryMonth("");
            setExpiryYear("");
            await fetchCards();
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to add card"));
        } finally {
            setProcessing(false);
        }
    };

    const requestDeleteCard = (cardId: string) => {
        setCardToDelete(cardId);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteCard = async () => {
        if (!cardToDelete) return;

        setIsDeleteModalOpen(false);
        setProcessing(true);
        setError("");

        try {
            await deleteCard(cardToDelete);
            await fetchCards();
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to delete card"));
        } finally {
            setProcessing(false);
            setCardToDelete(null);
        }
    };

    const cancelDeleteCard = () => {
        setIsDeleteModalOpen(false);
        setCardToDelete(null);
    };

    if (loading) {
        return <p className="page-status">Loading cards...</p>;
    }

    return (
        <>
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
                        inputMode="numeric"
                        autoComplete="cc-number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                    />
                </label>
                <div className="wallet-actions-row">
                    <label>
                        Card Brand
                        <select
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                        >
                            <option value="">Select brand</option>
                            <option value="Visa">Visa</option>
                            <option value="Mastercard">Mastercard</option>
                            <option value="RuPay">RuPay</option>
                            <option value="American Express">American Express</option>
                        </select>
                    </label>
                    <label>
                        Issuer Bank
                        <select
                            value={issuerBank}
                            onChange={(e) => setIssuerBank(e.target.value)}
                        >
                            <option value="">Select bank</option>
                            <option value="HDFC">HDFC</option>
                            <option value="SBI">SBI</option>
                            <option value="ICICI">ICICI</option>
                            <option value="AXIS">AXIS</option>
                        </select>
                    </label>
                </div>
                <div className="wallet-actions-row">
                    <label>
                        Expiry Month
                        <input
                            type="number"
                            min="1"
                            max="12"
                            autoComplete="cc-exp-month"
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
                            autoComplete="cc-exp-year"
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
                    <div className="payment-card-grid">
                        {cards.map((card) => (
                            <div key={card.id} className="payment-card-item">
                                <CreditCard
                                    brand={card.brand}
                                    issuerBank={card.issuerBank}
                                    lastFour={card.last4}
                                    expiryMonth={card.expiryMonth}
                                    expiryYear={card.expiryYear}
                                />
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => requestDeleteCard(card.id)}
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
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={cancelDeleteCard}
                onConfirm={handleDeleteCard}
                title="Delete Card?"
                description="Are you sure you want to remove this card? This action cannot be undone."
                confirmText="Delete Card"
                isProcessing={processing}
            />
        </>
    );
}
