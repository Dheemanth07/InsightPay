import prisma from "../../prisma.js";

export const createCard = (data) => {
    return prisma.card.create({ data });
};

export const findCardsByUserId = (userId) => {
    return prisma.card.findMany({
        where: { userId },
        select: {
            id: true,
            last4: true,
            brand: true,
            issuerBank: true,
            expiryMonth: true,
            expiryYear: true,
            createdAt: true,
        },
    });
};

export const findUserCardById = (userId, cardId) => {
    return prisma.card.findFirst({
        where: { id: cardId, userId },
    });
};

export const deleteCardById = (cardId) => {
    return prisma.card.delete({ where: { id: cardId } });
};
