import api from "./axios";

export const registerUser = (data: {
    name: string;
    email: string;
    password: string;
}) => {
    return api.post("http://localhost:5000/auth/register", data);
};
