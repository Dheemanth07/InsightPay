import { useCallback, useEffect, useState, type PropsWithChildren } from "react";
import { getMe, logoutUser } from "./auth.api";
import { AuthContext } from "./auth.context";
import type { User } from "./auth.types";

export function AuthProvider({ children }: PropsWithChildren) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const response = await getMe();
            setUser(response.data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async () => {
        await fetchUser();
    }, [fetchUser]);

    const logout = useCallback(async () => {
        try {
            await logoutUser();
        } finally {
            setUser(null);
        }
    }, []);

    const initializeSession = useCallback(async () => {
        await fetchUser();
    }, [fetchUser]);

    useEffect(() => {
        void initializeSession();
    }, [initializeSession]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
