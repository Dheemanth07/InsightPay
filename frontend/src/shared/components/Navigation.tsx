import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth.context";

export function Navigation() {
    const location = useLocation();
    const { logout } = useAuth();
    const navigate = useNavigate();

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="app-navigation">
            <div className="nav-container">
                <Link to="/dashboard" className="nav-logo">
                    InsightPay
                </Link>
                <ul className="nav-menu">
                    <li>
                        <Link
                            to="/dashboard"
                            className={`nav-link ${
                                isActive("/dashboard") ? "active" : ""
                            }`}
                        >
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/wallet"
                            className={`nav-link ${
                                isActive("/wallet") ? "active" : ""
                            }`}
                        >
                            Wallet
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/transactions"
                            className={`nav-link ${
                                isActive("/transactions") ? "active" : ""
                            }`}
                        >
                            Transactions
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/categories"
                            className={`nav-link ${
                                isActive("/categories") ? "active" : ""
                            }`}
                        >
                            Categories
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/cards"
                            className={`nav-link ${
                                isActive("/cards") ? "active" : ""
                            }`}
                        >
                            Cards
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/qr"
                            className={`nav-link ${
                                isActive("/qr") ? "active" : ""
                            }`}
                        >
                            QR Payment
                        </Link>
                    </li>
                    <li>
                        <button
                            type="button"
                            className="nav-link logout-btn"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </li>
                </ul>
            </div>
        </nav>
    );
}
