import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth.context";

const tabs = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/wallet", label: "Wallet" },
    { path: "/transactions", label: "Transactions" },
    { path: "/categories", label: "Categories" },
    { path: "/cards", label: "Cards" },
    { path: "/qr", label: "QR Payments" },
];

export function TopNavLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="top-nav-layout">
            <div className="top-nav-bar">
                <div className="top-nav-scroll">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            className={({ isActive }) =>
                                `top-nav-link ${isActive ? "active" : ""}`
                            }
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                </div>
                <button
                    type="button"
                    className="top-nav-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>
            <main className="top-nav-content">
                <Outlet />
            </main>
        </div>
    );
}
