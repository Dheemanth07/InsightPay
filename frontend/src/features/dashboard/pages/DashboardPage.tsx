import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/auth.context";

export function DashboardPage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <main className="app-page">
            <header className="page-header">
                <div>
                    <p className="eyebrow">Overview</p>
                    <h1>Dashboard</h1>
                </div>
                <button type="button" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <section className="panel">
                <p>Welcome,</p>
                <h2>{user?.name}</h2>
                <Link className="primary-link" to="/wallet">
                    Go to Wallet
                </Link>
            </section>

            <section className="muted-panel">
                Expense tracking, analytics, and insights are coming soon.
            </section>
        </main>
    );
}
