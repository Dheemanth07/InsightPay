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

export const getFrequentContactIds = async (userId) => {
    // 1. Transactions sent by the user to others
    const sentTxns = await prisma.transaction.findMany({
        where: {
            fromUserId: userId,
            toUserId: { not: null }
        },
        select: { toUserId: true }
    });

    // 2. Transactions received by the user from others
    const receivedTxns = await prisma.transaction.findMany({
        where: {
            toUserId: userId,
            fromUserId: { not: null }
        },
        select: { fromUserId: true }
    });

    // 3. Split requests initiated by the user
    const sentSplits = await prisma.splitRequest.findMany({
        where: { requesterId: userId },
        select: { payerId: true }
    });

    // 4. Split requests received by the user
    const receivedSplits = await prisma.splitRequest.findMany({
        where: { payerId: userId },
        select: { requesterId: true }
    });

    const counts = {};
    const increment = (id) => {
        if (id && id !== userId) {
            counts[id] = (counts[id] || 0) + 1;
        }
    };

    sentTxns.forEach(t => increment(t.toUserId));
    receivedTxns.forEach(t => increment(t.fromUserId));
    sentSplits.forEach(s => increment(s.payerId));
    receivedSplits.forEach(s => increment(s.requesterId));

    // Sort by count descending and get top 5
    const topIds = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => parseInt(id, 10));

    return { topIds, counts };
};

export const getFrequentContacts = async (userId) => {
    const { topIds, counts } = await getFrequentContactIds(userId);
    if (topIds.length === 0) {
        return [];
    }

    const users = await prisma.user.findMany({
        where: {
            id: { in: topIds }
        },
        select: {
            id: true,
            name: true,
            email: true
        }
    });

    // Sort users by count descending
    return users.sort((a, b) => counts[b.id] - counts[a.id]);
};

export const searchUsers = (currentUserId, query) => {
    return prisma.user.findMany({
        where: {
            id: { not: currentUserId },
            OR: [
                { name: { contains: query } },
                { email: { contains: query } }
            ]
        },
        select: {
            id: true,
            name: true,
            email: true
        },
        take: 20
    });
};

