import { apiClient } from "../../shared/api/client";
import type { Card } from "./cards.types";

export const getCards = () => {
    return apiClient.get<{ cards: Card[] }>("/cards");
};

export const addCard = (data: {
    cardNumber: string;
    brand: string;
    issuerBank: string;
    expiryMonth: number;
    expiryYear: number;
}) => {
    return apiClient.post("/cards/add", data);
};

export const deleteCard = (cardId: string) => {
    return apiClient.delete(`/cards/${cardId}`);
};
