import { useCallback, useEffect, useState, type PropsWithChildren } from "react";
import { getMe } from "./auth.api";
import { AuthContext } from "./auth.context";
import type { User } from "./auth.types";

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(() =>
        Boolean(localStorage.getItem("token")),
    );

    const fetchUser = useCallback(async () => {
        try {
            const response = await getMe();
            setUser(response.data);
        } catch {
            localStorage.removeItem("token");
            setUser(null);
        }
    }, []);

    const login = useCallback(async (token: string) => {
        localStorage.setItem("token", token);
        await fetchUser();
    }, [fetchUser]);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setUser(null);
    }, []);

    const initializeSession = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            return;
        }

        await fetchUser();
        setLoading(false);
    }, [fetchUser]);

    useEffect(() => {
        // Session restoration reads browser storage after the app mounts.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void initializeSession();
    }, [initializeSession]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
