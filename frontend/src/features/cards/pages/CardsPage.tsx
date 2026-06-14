import { useCallback, useEffect, useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { addCard, deleteCard, getCards } from "../cards.api";
import { CreditCard } from "../components/CreditCard";
import type { Card } from "../cards.types";
import { ConfirmationModal } from "../../../shared/components/ConfirmationModal";
import { useAuth } from "../../auth/auth.context";
import { Skeleton } from "../../../shared/components/Skeleton";

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
    const { user } = useAuth();

    const [activeIndex, setActiveIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);

    const fetchCards = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getCards();
            const loadedCards = response.data.cards || [];
            setCards(loadedCards);
            setActiveIndex((prev) => Math.min(prev, Math.max(0, loadedCards.length - 1)));
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

    const handleNext = () => {
        setActiveIndex((prev) => Math.min(prev + 1, cards.length - 1));
    };

    const handlePrev = () => {
        setActiveIndex((prev) => Math.max(prev - 1, 0));
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;

        if (diff > 50) {
            handleNext();
        } else if (diff < -50) {
            handlePrev();
        }
        setTouchStart(null);
    };

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
        return (
            <main className="app-page">
                <header className="page-header">
                    <div>
                        <Skeleton width="w-16" height="h-3.5" rounded="rounded-md" className="mb-2" />
                        <Skeleton width="w-64" height="h-8" rounded="rounded-lg" />
                    </div>
                </header>

                <section className="panel space-y-4">
                    <Skeleton width="w-32" height="h-6" rounded="rounded-md" />
                    <div className="space-y-3">
                        <div className="space-y-2">
                            <Skeleton width="w-24" height="h-3.5" rounded="rounded-md" />
                            <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton width="w-20" height="h-3.5" rounded="rounded-md" />
                                <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton width="w-24" height="h-3.5" rounded="rounded-md" />
                                <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Skeleton width="w-24" height="h-3.5" rounded="rounded-md" />
                                <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton width="w-20" height="h-3.5" rounded="rounded-md" />
                                <Skeleton width="w-full" height="h-10" rounded="rounded-lg" />
                            </div>
                        </div>
                    </div>
                    <Skeleton width="w-32" height="h-12" rounded="rounded-lg" />
                </section>

                <section className="panel space-y-4">
                    <div className="flex items-center justify-between">
                        <Skeleton width="w-28" height="h-6" rounded="rounded-md" />
                        <Skeleton width="w-20" height="h-4" rounded="rounded-md" />
                    </div>
                    <div className="relative h-[180px] sm:h-[240px] lg:h-[280px] w-full flex items-center justify-center overflow-hidden">
                        {/* Center Card */}
                        <div className="absolute translate-x-0 scale-100 opacity-100 z-20 flex flex-col items-center bg-transparent border-none shadow-none">
                            <div className="credit-card-scale-wrapper">
                                <div><Skeleton width="w-[400px]" height="h-[210px]" rounded="rounded-2xl" /></div>
                            </div>
                        </div>
                        {/* Left Card */}
                        <div className="absolute -translate-x-[65%] sm:-translate-x-[50%] scale-85 opacity-50 z-10 hidden sm:flex flex-col items-center bg-transparent border-none shadow-none">
                            <div className="credit-card-scale-wrapper">
                                <div><Skeleton width="w-[400px]" height="h-[210px]" rounded="rounded-2xl" /></div>
                            </div>
                        </div>
                        {/* Right Card */}
                        <div className="absolute translate-x-[65%] sm:translate-x-[50%] scale-85 opacity-50 z-10 hidden sm:flex flex-col items-center bg-transparent border-none shadow-none">
                            <div className="credit-card-scale-wrapper">
                                <div><Skeleton width="w-[400px]" height="h-[210px]" rounded="rounded-2xl" /></div>
                            </div>
                        </div>
                    </div>
                    {/* Pagination dots skeleton */}
                    <div className="flex justify-center gap-2 mt-4">
                        <div className="w-6 h-2.5 rounded-full bg-[#0d6b5f] opacity-30" />
                        <div className="w-4 h-2.5 rounded-full bg-white border border-[#0d6b5f] opacity-25" />
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
                    <div className="flex items-center justify-between mb-4">
                        <h2>Your Cards</h2>
                        {cards.length > 0 && (
                            <button
                                type="button"
                                onClick={() => requestDeleteCard(cards[activeIndex].id)}
                                disabled={processing}
                                className="text-xs font-semibold text-red-600 bg-white border border-red-500/40 hover:bg-red-50/50 hover:border-red-600 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
                            >
                                Remove Card
                            </button>
                        )}
                    </div>
                    {cards.length === 0 ? (
                        <p className="empty-state">No cards added yet.</p>
                    ) : (
                        <div className="flex flex-col">
                            {/* cover flow 3D carousel container */}
                            <div 
                                className="relative h-[180px] sm:h-[240px] lg:h-[290px] w-full flex items-center justify-center touch-pan-y overflow-hidden select-none"
                                onTouchStart={handleTouchStart}
                                onTouchEnd={handleTouchEnd}
                            >
                                {cards.map((card, index) => {
                                    const offset = index - activeIndex;
                                    let transformClass = "";

                                    if (offset === 0) {
                                        transformClass = "translate-x-0 scale-100 opacity-100 z-20";
                                    } else if (offset === -1) {
                                        transformClass = "-translate-x-[65%] sm:-translate-x-[50%] scale-85 opacity-50 z-10 cursor-pointer";
                                    } else if (offset === 1) {
                                        transformClass = "translate-x-[65%] sm:translate-x-[50%] scale-85 opacity-50 z-10 cursor-pointer";
                                    } else {
                                        // Hidden off to sides
                                        const isLeft = offset < 0;
                                        transformClass = `${isLeft ? "-translate-x-[200%]" : "translate-x-[200%]"} scale-75 opacity-0 z-0 pointer-events-none`;
                                    }

                                    return (
                                        <div 
                                            key={card.id} 
                                            onClick={() => {
                                                if (offset !== 0) {
                                                    setActiveIndex(index);
                                                }
                                            }}
                                            className={`absolute flex flex-col items-center transition-all duration-500 ease-out bg-transparent border-none shadow-none ${transformClass}`}
                                        >
                                            <div className="credit-card-scale-wrapper">
                                                <div>
                                                    <CreditCard
                                                        brand={card.brand}
                                                        issuerBank={card.issuerBank}
                                                        lastFour={card.last4}
                                                        expiryMonth={card.expiryMonth}
                                                        expiryYear={card.expiryYear}
                                                        userName={user?.name}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* dynamic pagination dots */}
                            <div className="flex justify-center gap-2 mt-4">
                                {cards.map((_, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setActiveIndex(index)}
                                        className={`h-2.5 rounded-full transition-all duration-300 ${
                                            index === activeIndex ? "bg-[#0d6b5f] w-6" : "bg-[#0d6b5f]/30 w-4 hover:bg-[#0d6b5f]/60"
                                        } p-0 m-0 border-0 cursor-pointer`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
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
