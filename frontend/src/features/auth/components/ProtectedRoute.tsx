import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth.context";

export function ProtectedRoute({ children }: PropsWithChildren) {
    const { user, loading } = useAuth();

    if (loading) return <p className="page-status">Loading...</p>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
