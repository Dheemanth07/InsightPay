import { Link } from "react-router-dom";
import { Zap, Split, BarChart2, ShieldCheck, ArrowRight, Wallet } from "lucide-react";

// ─── Inline Brand Icons (lucide-react v1+ removed brand icons) ────────────────

function GithubIcon({ size = 18 }: { size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
        </svg>
    );
}

function LinkedinIcon({ size = 18 }: { size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
        >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );
}

// ─── Feature Card Data ────────────────────────────────────────────────────────

const features = [
    {
        icon: Zap,
        title: "Lightning-Fast Transfers",
        description:
            "Send and receive money instantly with our smart contact lookup system — no more manually entering numeric receiver IDs.",
        accent: "bg-amber-50 text-amber-600",
        border: "border-amber-100",
    },
    {
        icon: Split,
        title: "Split the Bill",
        description:
            "Divide expenses effortlessly among friends. Send split requests and settle shared costs directly from within the app.",
        accent: "bg-blue-50 text-blue-600",
        border: "border-blue-100",
    },
    {
        icon: BarChart2,
        title: "Interactive Analytics",
        description:
            "Understand your spending habits with dynamic, real-time Recharts visualisations, cash-flow history, and category breakdowns.",
        accent: "bg-teal-50 text-teal-700",
        border: "border-teal-100",
    },
    {
        icon: ShieldCheck,
        title: "Robust Security",
        description:
            "JWT-based auth, bcrypt password hashing, Helmet middleware, and strict CORS policies keep every transaction safe.",
        accent: "bg-slate-100 text-slate-600",
        border: "border-slate-200",
    },
];

// ─── Tech Stack Badges ────────────────────────────────────────────────────────

const stack = [
    { label: "React 19", color: "bg-sky-50 text-sky-700 border-sky-200" },
    { label: "TypeScript", color: "bg-blue-50 text-blue-700 border-blue-200" },
    { label: "Tailwind CSS", color: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    { label: "Node.js", color: "bg-green-50 text-green-700 border-green-200" },
    { label: "Express", color: "bg-slate-100 text-slate-700 border-slate-200" },
    { label: "Prisma ORM", color: "bg-purple-50 text-purple-700 border-purple-200" },
    { label: "TiDB Cloud", color: "bg-red-50 text-red-700 border-red-200" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export function LandingPage() {
    return (
        <div className="min-h-screen bg-[#f4f7f8] font-[Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] text-[#172026]">

            {/* ── Navigation Bar ───────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#e6eaee]">
                <nav className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
                    {/* Logo */}
                    <Link
                        to="/"
                        className="flex items-center gap-0.5 tracking-tight hover:scale-[1.02] transition-transform duration-200 ease-out select-none no-underline"
                    >
                        <span className="text-2xl font-extrabold text-[#0f1419]">Insight</span>
                        <span className="text-2xl font-medium text-[#0d6b5f]">Pay</span>
                    </Link>

                    {/* Right CTAs */}
                    <div className="flex items-center gap-3">
                        <Link
                            to="/login"
                            className="text-sm font-semibold text-[#172026] hover:text-[#0d6b5f] transition-colors no-underline hidden sm:inline-flex"
                        >
                            Sign In
                        </Link>
                        <Link
                            to="/signup"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white bg-[#0d6b5f] hover:bg-[#094d45] transition-colors no-underline shadow-sm"
                        >
                            Get Started
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </nav>
            </header>

            <main>
                {/* ── Hero Section ─────────────────────────────────────────── */}
                <section className="relative overflow-hidden">
                    {/* Subtle gradient orbs */}
                    <div className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#0d6b5f]/5 blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-[#0d6b5f]/5 blur-3xl pointer-events-none" />

                    <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Copy */}
                        <div>
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-[#0d6b5f]/10 text-[#0d6b5f] mb-6">
                                Full-Stack Portfolio Project
                            </span>
                            <h1 className="text-4xl sm:text-5xl font-extrabold text-[#0f1419] leading-[1.1] tracking-tight mb-5">
                                Seamless P2P Payments &amp;{" "}
                                <span className="text-[#0d6b5f]">Smart Wallet</span>{" "}
                                Management.
                            </h1>
                            <p className="text-lg text-[#4d5c65] leading-relaxed mb-8 max-w-xl">
                                A secure platform to track transactions, split bills, and
                                visualise your financial data in real-time — built with a
                                modern full-stack architecture.
                            </p>
                            <div className="flex flex-wrap items-center gap-4">
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-bold text-white bg-[#0d6b5f] hover:bg-[#094d45] transition-colors no-underline shadow-sm"
                                >
                                    Create an Account
                                    <ArrowRight size={16} />
                                </Link>
                                <Link
                                    to="/login"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-base font-semibold text-[#172026] bg-white border border-[#dce4e8] hover:border-[#0d6b5f] hover:text-[#0d6b5f] transition-colors no-underline shadow-sm"
                                >
                                    Sign In
                                </Link>
                            </div>
                        </div>

                        {/* Right: App Mockup */}
                        <div className="relative flex items-center justify-center">
                            <div className="w-full max-w-md bg-white rounded-[28px] border border-[#dce4e8] shadow-2xl shadow-[#0d6b5f]/5 overflow-hidden">
                                {/* Fake browser chrome */}
                                <div className="bg-[#f4f7f8] border-b border-[#e6eaee] px-4 py-3 flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-300" />
                                    <span className="w-3 h-3 rounded-full bg-amber-300" />
                                    <span className="w-3 h-3 rounded-full bg-green-300" />
                                    <span className="flex-1 bg-white rounded-md text-xs text-[#9aa3ad] text-center py-1 px-3 mx-2 border border-[#e6eaee]">
                                        insightpay.vercel.app/dashboard
                                    </span>
                                </div>

                                {/* Mock Dashboard UI */}
                                <div className="p-5 space-y-4">
                                    {/* Balance card */}
                                    <div className="bg-[#0d6b5f] rounded-2xl p-5 text-white">
                                        <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">
                                            Current Balance
                                        </p>
                                        <p className="text-3xl font-extrabold tracking-tight">
                                            ₹ 24,830.00
                                        </p>
                                        <div className="flex gap-3 mt-4">
                                            <span className="text-xs bg-white/20 rounded-full px-3 py-1 font-semibold">
                                                + Add Money
                                            </span>
                                            <span className="text-xs bg-white/20 rounded-full px-3 py-1 font-semibold">
                                                ↑ Send
                                            </span>
                                        </div>
                                    </div>

                                    {/* Mini chart placeholder */}
                                    <div className="bg-[#f4f7f8] rounded-2xl p-4 border border-[#e6eaee]">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-xs font-bold text-[#0f1419]">
                                                Cash Flow — Last 6 Months
                                            </p>
                                            <Wallet size={14} className="text-[#0d6b5f]" />
                                        </div>
                                        {/* Bar chart mock */}
                                        <div className="flex items-end gap-2 h-16">
                                            {[55, 80, 40, 90, 65, 75].map((h, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-1 rounded-t-md"
                                                    style={{
                                                        height: `${h}%`,
                                                        backgroundColor:
                                                            i % 2 === 0
                                                                ? "#0d6b5f"
                                                                : "#94a3b8",
                                                        opacity: 0.7 + i * 0.05,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex justify-between mt-2">
                                            {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map(
                                                (m) => (
                                                    <span
                                                        key={m}
                                                        className="text-[10px] text-[#9aa3ad]"
                                                    >
                                                        {m}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent transactions mock */}
                                    <div>
                                        <p className="text-xs font-bold text-[#0f1419] mb-2.5">
                                            Recent Transactions
                                        </p>
                                        {[
                                            { label: "Sent to Priya S.", amount: "−₹500", color: "text-red-500" },
                                            { label: "Received from Raj K.", amount: "+₹1,200", color: "text-[#177245]" },
                                            { label: "Split — Dinner", amount: "−₹340", color: "text-red-500" },
                                        ].map((tx) => (
                                            <div
                                                key={tx.label}
                                                className="flex items-center justify-between py-2 border-b border-[#edf1f3] last:border-b-0"
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full bg-[#f1f5f9] border border-[#e8ecf0] flex items-center justify-center text-[10px] font-bold text-[#475569]">
                                                        {tx.label[0]}
                                                    </div>
                                                    <span className="text-xs font-semibold text-[#1e293b]">
                                                        {tx.label}
                                                    </span>
                                                </div>
                                                <span className={`text-xs font-bold ${tx.color}`}>
                                                    {tx.amount}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Floating accent badge */}
                            <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl border border-[#dce4e8] shadow-lg px-4 py-2.5 flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#0d6b5f] animate-pulse" />
                                <span className="text-xs font-bold text-[#0f1419]">
                                    Real-time sync
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Features Grid ────────────────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-6 py-20">
                    <div className="text-center mb-14">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#0d6b5f] mb-3">
                            What's Inside
                        </p>
                        <h2 className="text-3xl font-extrabold text-[#0f1419] tracking-tight">
                            Everything you need in one place
                        </h2>
                        <p className="mt-3 text-[#4d5c65] max-w-lg mx-auto">
                            A full set of financial tools, built from the ground up with
                            developer-grade quality.
                        </p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {features.map(({ icon: Icon, title, description, accent, border }) => (
                            <div
                                key={title}
                                className={`bg-white rounded-[20px] border ${border} p-6 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center flex-shrink-0`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-[#0f1419] mb-1.5">
                                        {title}
                                    </h3>
                                    <p className="text-sm text-[#4d5c65] leading-relaxed">
                                        {description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Tech Stack ───────────────────────────────────────────── */}
                <section className="border-t border-[#dce4e8] bg-white">
                    <div className="max-w-6xl mx-auto px-6 py-14">
                        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#9aa3ad] mb-8">
                            Powered By
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                            {stack.map(({ label, color }) => (
                                <span
                                    key={label}
                                    className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border ${color}`}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── CTA Banner ───────────────────────────────────────────── */}
                <section className="max-w-6xl mx-auto px-6 py-16">
                    <div className="bg-[#0d6b5f] rounded-[28px] px-8 py-14 text-center text-white relative overflow-hidden">
                        {/* decorative circles */}
                        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/5" />
                        <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5" />

                        <h2 className="relative text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
                            Try InsightPay
                        </h2>
                        <p className="relative text-[#a7d4cf] max-w-sm mx-auto mb-8 text-sm leading-relaxed">
                            Create a free account, add your wallet balance, and explore the
                            full feature set in minutes.
                        </p>
                        <Link
                            to="/signup"
                            className="relative inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-bold text-[#0d6b5f] bg-white hover:bg-[#f0fdf4] transition-colors no-underline shadow-sm"
                        >
                            Create an Account
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </section>
            </main>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <footer className="border-t border-[#dce4e8] bg-white">
                <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Left */}
                    <div className="flex flex-col sm:items-start items-center gap-1 text-center sm:text-left">
                        <div className="flex items-center gap-0.5">
                            <span className="text-base font-extrabold text-[#0f1419]">Insight</span>
                            <span className="text-base font-medium text-[#0d6b5f]">Pay</span>
                        </div>
                        <p className="text-xs text-[#63717a]">
                            Designed &amp; Built by{" "}
                            <span className="font-semibold text-[#0f1419]">Dheemanth</span>
                        </p>
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-5">
                        <a
                            href="https://github.com/Dheemanth07/InsightPay"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-[#4d5c65] hover:text-[#0d6b5f] transition-colors no-underline"
                            aria-label="View source on GitHub"
                        >
                            <GithubIcon size={16} />
                            <span>View source on GitHub</span>
                        </a>
                        <a
                            href="https://linkedin.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4d5c65] hover:text-[#0d6b5f] transition-colors"
                            aria-label="LinkedIn"
                        >
                            <LinkedinIcon size={18} />
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
