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
            isPrimary: true,
            createdAt: true,
        },
        orderBy: [
            { isPrimary: "desc" },
            { createdAt: "desc" },
        ],
    });
};

export const findUserCardById = (userId, cardId) => {
    return prisma.card.findFirst({
        where: { id: cardId, userId },
    });
};

export const countUserCards = (userId) => {
    return prisma.card.count({ where: { userId } });
};

export const setPrimaryCardForUserRepo = (userId, cardId) => {
    return prisma.$transaction(async (tx) => {
        await tx.card.updateMany({
            where: { userId },
            data: { isPrimary: false },
        });

        const updated = await tx.card.update({
            where: { id: cardId },
            data: { isPrimary: true },
        });

        return updated;
    });
};

export const deleteCardById = (cardId) => {
    return prisma.card.delete({ where: { id: cardId } });
};
