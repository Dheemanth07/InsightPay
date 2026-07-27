export type Card = {
    id: string;
    last4: string;
    brand: string;
    issuerBank: string;
    expiryMonth: number;
    expiryYear: number;
    isPrimary?: boolean;
    createdAt: string;
};
