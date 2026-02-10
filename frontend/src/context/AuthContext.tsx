import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

type User = {
    id: number;
    name: string;
    email: string;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: async () => {},
    logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Function to fetch user data using the token
    const fetchUser = async (token: string) => {
        try {
            // Note: Ensure this matches your backend endpoint exactly (/auth/me)
            const res = await api.get("/auth/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUser(res.data.user);
        } catch (err) {
            localStorage.removeItem("token");
            setUser(null);
        }
    };

    const login = async (token: string) => {
        localStorage.setItem("token", token);
        await fetchUser(token); // Update state immediately after login
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            fetchUser(token).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
