import { apiClient } from "../../shared/api/client";

export type Card = {
    id: string;
    last4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
    createdAt: string;
};

export const getCards = () => {
    return apiClient.get<{ cards: Card[] }>("/cards");
};

export const addCard = (data: {
    cardNumber: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
}) => {
    return apiClient.post("/cards/add", data);
};

export const deleteCard = (cardId: string) => {
    return apiClient.delete(`/cards/${cardId}`);
};
