import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth.context";
import { TopNavLayout } from "../../../shared/components/TopNavLayout";

export function ProtectedRoute({ children }: PropsWithChildren) {
    const { user, loading } = useAuth();

    if (loading) return <TopNavLayout />;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
