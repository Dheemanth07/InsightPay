import { useAuth } from "../../auth/auth.context";

export function DashboardPage() {
    const { user } = useAuth();

    return (
        <main className="app-page">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Overview</p>
                    <h1>Dashboard</h1>
                </div>
            </header>

            <section className="panel">
                <p>Welcome,</p>
                <h2>{user?.name}</h2>
                <p className="primary-link">
                    Use the tab navigation above to access Wallet, Transactions,
                    Categories, Cards, and QR Payments.
                </p>
            </section>

            <section className="muted-panel">
                Expense tracking, analytics, and insights are coming soon.
            </section>
        </main>
    );
}
