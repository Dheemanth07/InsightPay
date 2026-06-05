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
import { TopNavLayout } from "../shared/components/TopNavLayout";

export function App() {
    return (
        <Routes>
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <TopNavLayout />
                    </ProtectedRoute>
                }
            >
                <Route path="" element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="wallet" element={<WalletPage />} />
                <Route path="transactions" element={<TransactionsPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="cards" element={<CardsPage />} />
                <Route path="qr" element={<QRPage />} />
            </Route>
        </Routes>
    );
}
