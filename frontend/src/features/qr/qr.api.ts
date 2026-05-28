import { apiClient } from "../../shared/api/client";

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

export const generateQR = (amount: number) => {
    return apiClient.post<QRGenerated>("/qr/generate", { amount });
};

export const validateQR = (qrData: string) => {
    return apiClient.post<QRValidated>("/qr/validate", { qrData });
};

export const confirmQRPayment = (qrData: string) => {
    return apiClient.post<QRPaymentResult>("/qr/confirm", { qrData });
};
