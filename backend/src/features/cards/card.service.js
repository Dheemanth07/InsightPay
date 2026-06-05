import { generateCardToken } from "../../utils/tokenization.js";
import {
    createCard,
    deleteCardById,
    findCardsByUserId,
    findUserCardById,
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

    return createCard({
        userId,
        cardToken: generateCardToken(),
        last4: String(cardNumber).slice(-4),
        brand,
        issuerBank,
        expiryMonth,
        expiryYear,
    });
};

export const getCardsForUser = (userId) => {
    return findCardsByUserId(userId);
};

export const deleteCardForUser = async (userId, cardId) => {
    const card = await findUserCardById(userId, cardId);

    if (!card) {
        const error = new Error("Card not found");
        error.statusCode = 404;
        throw error;
    }

    await deleteCardById(cardId);
};
