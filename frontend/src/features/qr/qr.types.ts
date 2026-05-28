export type QRGenerated = {
    qrData: string;
    reference: string;
    amount: number;
    expiresAt: string;
};

export type QRValidated = {
    isValid: boolean;
    reference: string;
    amount: number;
    receiverId: number;
};

export type QRPaymentResult = {
    transactionId: number;
    amount: number;
    reference: string;
    status: string;
};
