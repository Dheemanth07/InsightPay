import {
    addCardForUser,
    deleteCardForUser,
    getCardsForUser,
} from "./card.service.js";

export const addCard = async (req, res) => {
    try {
        const card = await addCardForUser(req.user.id, req.body);

        return res
            .status(201)
            .json({ message: "Card added successfully", card });
    } catch (err) {
        console.error("Error adding card:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};

export const getCards = async (req, res) => {
    try {
        const cards = await getCardsForUser(req.user.id);

        return res.status(200).json({ cards });
    } catch (err) {
        console.error("Error retrieving cards:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const deleteCard = async (req, res) => {
    try {
        await deleteCardForUser(req.user.id, req.params.cardId);

        return res.status(200).json({ message: "Card deleted successfully" });
    } catch (err) {
        console.error("Error deleting card:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};
