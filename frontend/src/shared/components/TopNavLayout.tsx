import { useState } from "react";
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="top-nav-layout">
            <div className="top-nav-bar flex items-center justify-between">
                {/* Brand / Logo */}
                <NavLink
                    to="/dashboard"
                    className="flex items-center space-x-0.5 tracking-tight hover:scale-[1.02] transition-transform duration-200 ease-out select-none mr-4"
                >
                    <span className="text-2xl font-extrabold text-[#0f1419]">Insight</span>
                    <span className="text-2xl font-medium text-[#0d6b5f]">Pay</span>
                </NavLink>

                {/* Main desktop navigation buttons */}
                <div className="top-nav-scroll hidden md:flex">
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

                {/* Desktop Logout Button */}
                <button
                    type="button"
                    className="top-nav-logout hidden md:block"
                    onClick={handleLogout}
                    disabled={loading}
                >
                    Logout
                </button>

                {/* Hamburger menu icon button visible only on mobile */}
                <button
                    type="button"
                    className="flex md:hidden items-center justify-center p-2 rounded-lg text-[#0d6b5f] hover:bg-gray-100 border border-gray-200 bg-transparent m-0 focus:outline-none cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle Navigation Menu"
                >
                    <svg
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                    >
                        {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Dropdown Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-[#e6eaee] px-6 py-4 flex flex-col gap-2 shadow-sm animate-fade-in">
                    {tabs.map((tab) => (
                        <NavLink
                            key={tab.path}
                            to={tab.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={({ isActive }) =>
                                `w-full flex items-center py-3 px-4 rounded-xl text-base font-bold transition no-underline ${
                                    isActive
                                        ? "bg-[#0d6b5f] text-white"
                                        : "bg-[#f5f8fb] text-[#172026] hover:bg-[#e8eff5]"
                                }`
                            }
                        >
                            {tab.label}
                        </NavLink>
                    ))}
                    <button
                        type="button"
                        className="w-full flex items-center justify-center py-3 px-4 mt-2 rounded-xl text-base font-bold border border-[#0d6b5f] text-[#0d6b5f] bg-transparent hover:bg-[#0d6b5f] hover:text-white transition cursor-pointer"
                        onClick={() => {
                            setIsMobileMenuOpen(false);
                            handleLogout();
                        }}
                        disabled={loading}
                    >
                        Logout
                    </button>
                </div>
            )}

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
