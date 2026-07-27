import { generateCardToken } from "../../utils/tokenization.js";
import {
    createCard,
    deleteCardById,
    findCardsByUserId,
    findUserCardById,
    countUserCards,
    setPrimaryCardForUserRepo,
} from "./card.repository.js";

export const addCardForUser = async (
    userId,
    { cardNumber, expiryMonth, expiryYear, brand, issuerBank },
) => {
    if (!cardNumber || String(cardNumber).length < 4) {
        const error = new Error("Valid card number is required");
        error.statusCode = 400;
        throw error;
    }

    if (!brand) {
        const error = new Error("Card brand is required");
        error.statusCode = 400;
        throw error;
    }

    if (!issuerBank) {
        const error = new Error("Issuer bank is required");
        error.statusCode = 400;
        throw error;
    }

    if (!expiryMonth || !expiryYear) {
        const error = new Error("Card expiry month and year are required");
        error.statusCode = 400;
        throw error;
    }

    const cardCount = await countUserCards(userId);
    const isPrimary = cardCount === 0;

    return createCard({
        userId,
        cardToken: generateCardToken(),
        last4: String(cardNumber).slice(-4),
        brand,
        issuerBank,
        expiryMonth,
        expiryYear,
        isPrimary,
    });
};

export const getCardsForUser = (userId) => {
    return findCardsByUserId(userId);
};

export const setPrimaryCardForUser = async (userId, cardId) => {
    const card = await findUserCardById(userId, cardId);
    if (!card) {
        const error = new Error("Card not found");
        error.statusCode = 404;
        throw error;
    }

    return setPrimaryCardForUserRepo(userId, cardId);
};

export const deleteCardForUser = async (userId, cardId) => {
    const card = await findUserCardById(userId, cardId);

    if (!card) {
        const error = new Error("Card not found");
        error.statusCode = 404;
        throw error;
    }

    await deleteCardById(cardId);

    // If the deleted card was primary, set the newest remaining card as primary
    if (card.isPrimary) {
        const remaining = await findCardsByUserId(userId);
        if (remaining.length > 0) {
            await setPrimaryCardForUserRepo(userId, remaining[0].id);
        }
    }
};
