import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SignupPage } from "../features/auth/pages/SignupPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { WalletPage } from "../features/wallet/pages/WalletPage";

export function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/wallet"
                element={
                    <ProtectedRoute>
                        <WalletPage />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
