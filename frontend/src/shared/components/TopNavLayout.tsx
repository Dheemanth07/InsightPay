import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/auth.context";
import { Skeleton } from "./Skeleton";
import { InsightPayLogo } from "./InsightPayLogo";

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
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Refs for the sliding indicator
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

    const handleLogout = () => {
        navigate("/");
        setTimeout(() => {
            logout();
        }, 150);
    };

    // Move the sliding indicator to match the active tab
    useEffect(() => {
        const container = tabsContainerRef.current;
        const slider = sliderRef.current;
        if (!container || !slider) return;

        const activeIndex = tabs.findIndex((t) =>
            location.pathname.startsWith(t.path)
        );
        if (activeIndex === -1) {
            slider.style.opacity = "0";
            return;
        }

        const activeEl = linkRefs.current[activeIndex];
        if (!activeEl) return;

        const containerRect = container.getBoundingClientRect();
        const activeRect = activeEl.getBoundingClientRect();

        slider.style.opacity = "1";
        slider.style.width = `${activeRect.width}px`;
        slider.style.transform = `translateX(${activeRect.left - containerRect.left - 3}px)`;
    }, [location.pathname]);

    return (
        <div className="top-nav-layout">
            <div className="top-nav-bar">
                {/* Brand / Logo */}
                <NavLink
                    to="/dashboard"
                    className="flex items-center space-x-1.5 tracking-tight hover:scale-[1.02] transition-transform duration-200 ease-out select-none mr-2 no-underline shrink-0"
                >
                    <InsightPayLogo className="w-8 h-8" />
                    <span className="text-xl font-extrabold text-[#0f1419]">Insight</span>
                    <span className="text-xl font-medium text-[#0d6b5f]">Pay</span>
                </NavLink>

                {/* Desktop sliding tabs */}
                <div className="top-nav-tabs hidden md:flex" ref={tabsContainerRef}>
                    {/* Sliding indicator */}
                    <div
                        ref={sliderRef}
                        className="top-nav-slider"
                        style={{ opacity: 0, width: 0 }}
                        aria-hidden="true"
                    />
                    {/* Tab links */}
                    <div className="top-nav-scroll">
                        {tabs.map((tab, i) => (
                            <NavLink
                                key={tab.path}
                                to={tab.path}
                                ref={(el) => { linkRefs.current[i] = el; }}
                                className={({ isActive }) =>
                                    `top-nav-link ${isActive ? "active" : ""}`
                                }
                            >
                                {tab.label}
                            </NavLink>
                        ))}
                    </div>
                </div>

                {/* Desktop Logout */}
                <button
                    type="button"
                    className="top-nav-logout hidden md:block"
                    onClick={handleLogout}
                    disabled={loading}
                >
                    Logout
                </button>

                {/* Hamburger — mobile only */}
                <button
                    type="button"
                    className="flex md:hidden items-center justify-center p-2 rounded-lg text-[#0d6b5f] hover:bg-gray-100 border border-gray-200 bg-transparent m-0 focus:outline-none cursor-pointer"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle Navigation Menu"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>

            {/* Mobile Dropdown */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed top-18 left-4 right-4 z-40 bg-white/95 backdrop-blur-md border border-[#e6eaee] rounded-2xl px-4 py-4 flex flex-col gap-2 shadow-lg animate-fade-in">
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
