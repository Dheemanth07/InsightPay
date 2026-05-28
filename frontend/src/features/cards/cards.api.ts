import { apiClient } from "../../shared/api/client";

export type Card = {
    id: number;
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
    isDefault: boolean;
    createdAt: string;
};

export const getCards = () => {
    return apiClient.get<{ cards: Card[] }>("/cards");
};

export const addCard = (data: {
    cardNumber: string;
    cardholderName: string;
    expiryDate: string;
}) => {
    return apiClient.post("/cards/add", data);
};

export const deleteCard = (cardId: number) => {
    return apiClient.delete(`/cards/${cardId}`);
};
