import prisma from "../../prisma.js";

export const findUserByEmail = (email) => {
    return prisma.user.findUnique({ where: { email } });
};

export const findUserProfileById = (id) => {
    return prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
            balance: true,
            createdAt: true,
        },
    });
};

export const createUser = ({ name, email, password }) => {
    return prisma.user.create({
        data: { name, email, password },
        select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
        },
    });
};
