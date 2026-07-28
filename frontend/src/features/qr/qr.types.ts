export type QRGenerated = {
    qrData: string;
    qrImage: string;
    reference: string;
    amount: number;
    expiresAt: string;
};

export type QRValidated = {
    isValid: boolean;
    reference: string;
    amount: number;
    receiverId: number;
    isUniversalUpi?: boolean;
    upiId?: string;
    payeeName?: string;
};

export type QRPaymentResult = {
    transactionId: number;
    amount: number;
    reference: string;
    status: string;
};
