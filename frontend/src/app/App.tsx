import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "../features/auth/components/ProtectedRoute";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SignupPage } from "../features/auth/pages/SignupPage";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { WalletPage } from "../features/wallet/pages/WalletPage";
import { TransactionsPage } from "../features/transactions/pages/TransactionsPage";
import { CategoriesPage } from "../features/categories/pages/CategoriesPage";
import { CardsPage } from "../features/cards/pages/CardsPage";
import { QRPage } from "../features/qr/pages/QRPage";

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
            <Route
                path="/transactions"
                element={
                    <ProtectedRoute>
                        <TransactionsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/categories"
                element={
                    <ProtectedRoute>
                        <CategoriesPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/cards"
                element={
                    <ProtectedRoute>
                        <CardsPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/qr"
                element={
                    <ProtectedRoute>
                        <QRPage />
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}
