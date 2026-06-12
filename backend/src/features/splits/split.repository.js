import prisma from "../../prisma.js";

export const createSplitRequests = (dataArray) => {
    return prisma.splitRequest.createMany({
        data: dataArray,
    });
};

export const findSplitById = (id) => {
    return prisma.splitRequest.findUnique({
        where: { id },
        include: {
            requester: {
                select: { id: true, name: true, email: true },
            },
            payer: {
                select: { id: true, name: true, email: true },
            },
            transaction: true,
        },
    });
};

export const findIncomingPendingSplits = (userId) => {
    return prisma.splitRequest.findMany({
        where: {
            payerId: userId,
            status: "PENDING",
        },
        include: {
            requester: {
                select: { id: true, name: true, email: true },
            },
            transaction: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};

export const findOutgoingSplits = (userId) => {
    return prisma.splitRequest.findMany({
        where: {
            requesterId: userId,
        },
        include: {
            payer: {
                select: { id: true, name: true, email: true },
            },
            transaction: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
};
