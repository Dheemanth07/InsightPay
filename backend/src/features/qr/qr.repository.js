import prisma from "../../prisma.js";

export const createPendingQrTransaction = ({ reference, amount, receiverId, expiresAt }) => {
    return prisma.transaction.create({
        data: {
            reference,
            amount,
            type: "TRANSFER",
            method: "QR_CODE",
            status: "PENDING",
            toUserId: receiverId,
            qrExpiresAt: expiresAt,
        },
    });
};

export const findQrTransactionByReference = (reference) => {
    return prisma.transaction.findUnique({
        where: { reference },
        include: {
            toUser: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
};

export const confirmQrPaymentTransaction = (payerId, reference) => {
    return prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
            where: { reference },
            include: { toUser: true },
        });

        if (!transaction) throw new Error("Transaction not found");
        if (transaction.status !== "PENDING") {
            throw new Error("QR already used or Transaction already processed");
        }
        if (transaction.toUserId === payerId) throw new Error("Cannot pay to yourself");

        const receiverId = transaction.toUserId;
        const [firstId, secondId] = payerId < receiverId ? [payerId, receiverId] : [receiverId, payerId];

        // Acquire locks in deterministic order to prevent deadlocks
        await tx.$queryRaw`SELECT id FROM User WHERE id = ${firstId} FOR UPDATE`;
        await tx.$queryRaw`SELECT id FROM User WHERE id = ${secondId} FOR UPDATE`;

        const payer = await tx.user.findUnique({ where: { id: payerId } });
        if (!payer || Number(payer.balance) < Number(transaction.amount)) {
            throw new Error("Insufficient balance");
        }

        await tx.user.update({
            where: { id: payerId },
            data: { balance: { decrement: transaction.amount } },
        });

        await tx.user.update({
            where: { id: receiverId },
            data: { balance: { increment: transaction.amount } },
        });

        await tx.transaction.update({
            where: { reference },
            data: { status: "SUCCESS", fromUserId: payerId },
        });

        return transaction;
    });
};

export const markQrTransactionAsProcessed = (reference, fromUserId) => {
    return prisma.transaction.update({
        where: { reference },
        data: { status: "SUCCESS", fromUserId },
    });
};

export const getQrTransactionStatus = (reference) => {
    return prisma.transaction.findUnique({
        where: { reference },
        select: {
            reference: true,
            status: true,
            amount: true,
            fromUserId: true,
            toUserId: true,
        },
    });
};
