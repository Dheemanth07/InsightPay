import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import React from "react";

export default function ProtectedRoute({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, loading } = useAuth();

    if (loading) return <p>Loading...</p>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
