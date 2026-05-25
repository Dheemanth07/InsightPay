export type User = {
    id: number;
    name: string;
    email: string;
    balance?: number | string;
};

export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
};

export type LoginPayload = Omit<RegisterPayload, "name">;
