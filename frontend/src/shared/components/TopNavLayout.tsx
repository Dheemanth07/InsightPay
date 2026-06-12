import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth.context";
import { Skeleton } from "./Skeleton";

const tabs = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/wallet", label: "Wallet" },
    { path: "/transactions", label: "Transactions" },
    { path: "/categories", label: "Categories" },
    { path: "/cards", label: "Cards" },
    { path: "/qr", label: "QR Payments" },
];

export function TopNavLayout() {
    const { logout, loading } = useAuth();
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
                    disabled={loading}
                >
                    Logout
                </button>
            </div>
            <main className="top-nav-content">
                {loading ? (
                    <div className="font-sans text-[#141820] space-y-6">
                        <header className="mb-8">
                            <Skeleton width="w-20" height="h-4" rounded="rounded-md" />
                            <Skeleton width="w-48" height="h-10" rounded="rounded-lg" className="mt-2" />
                        </header>
                        <Skeleton width="w-full" height="h-14" rounded="rounded-2xl" className="mb-6" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <Skeleton width="w-full" height="h-48" rounded="rounded-[28px]" />
                                <Skeleton width="w-full" height="h-80" rounded="rounded-[28px]" />
                            </div>
                            <div className="space-y-6">
                                <Skeleton width="w-full" height="h-[260px]" rounded="rounded-[28px]" />
                                <Skeleton width="w-full" height="h-[260px]" rounded="rounded-[28px]" />
                            </div>
                        </div>
                    </div>
                ) : (
                    <Outlet />
                )}
            </main>
        </div>
    );
}
