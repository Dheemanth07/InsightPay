import type { CSSProperties } from "react";

export interface CreditCardProps {
    brand: string;
    issuerBank: string;
    lastFour: string;
    expiryMonth: string | number;
    expiryYear: string | number;
    userName?: string;
}

type Theme = "axis" | "sbi" | "hdfc" | "icici" | "fallback";

const normalize = (value: string) => value.trim().toLowerCase();

const resolveTheme = (issuerBank: string): Theme => {
    const bank = normalize(issuerBank);
    if (bank.includes("axis")) return "axis";
    if (bank.includes("sbi")) return "sbi";
    if (bank.includes("hdfc")) return "hdfc";
    if (bank.includes("icici")) return "icici";
    return "fallback";
};

const formatExpiry = (month: string | number, year: string | number) => {
    const mm = String(month).padStart(2, "0").slice(-2);
    const yy = String(year).slice(-2);
    return `${mm}/${yy}`;
};

const safeLastFour = (lastFour: string) =>
    lastFour.replace(/\D/g, "").slice(-4).padStart(4, "0");

const cardBase: CSSProperties = {
    position: "relative",
    width: 400,
    height: 210,
    overflow: "hidden",
    borderRadius: 16,
    boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    color: "#ffffff",
    fontFamily:
        'Inter, "Segoe UI", Arial, Helvetica, sans-serif',
    userSelect: "none",
};

const textShadow: CSSProperties = {
    textShadow: "0 1px 2px rgba(0,0,0,0.28)",
};

function Chip() {
    return (
        <div
            style={{
                position: "absolute",
                left: 34,
                top: 74,
                width: 46,
                height: 35,
                borderRadius: 8,
                background:
                    "linear-gradient(135deg, #f2d27b 0%, #b58a32 45%, #fff0a8 100%)",
                border: "1px solid rgba(80,55,16,0.35)",
                boxShadow:
                    "inset 0 0 0 1px rgba(255,255,255,0.45), 0 3px 7px rgba(0,0,0,0.2)",
            }}
        >
            {[11, 23].map((top) => (
                <div
                    key={top}
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top,
                        height: 1,
                        background: "rgba(74,49,12,0.42)",
                    }}
                />
            ))}
            {[14, 31].map((left) => (
                <div
                    key={left}
                    style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left,
                        width: 1,
                        background: "rgba(74,49,12,0.35)",
                    }}
                />
            ))}
            <div
                style={{
                    position: "absolute",
                    left: 15,
                    top: 8,
                    width: 16,
                    height: 19,
                    border: "1px solid rgba(74,49,12,0.46)",
                    borderRadius: 4,
                }}
            />
        </div>
    );
}

function Contactless({
    left,
    top,
    color = "#ffffff",
}: {
    left: number;
    top: number;
    color?: string;
}) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 28 28"
            style={{
                position: "absolute",
                left,
                top,
                width: 28,
                height: 28,
                fill: "none",
                stroke: color,
                strokeLinecap: "round",
                strokeWidth: 2.3,
            }}
        >
            <path d="M7 10c2.2 2.2 2.2 5.8 0 8" />
            <path d="M12 7c4 4 4 10 0 14" />
            <path d="M17 4c6.5 6.5 6.5 13 0 20" />
        </svg>
    );
}

function AxisGlyph() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
                style={{
                    width: 28,
                    height: 34,
                    clipPath: "polygon(46% 0, 100% 100%, 64% 100%, 44% 58%, 25% 100%, 0 100%)",
                    background: "#ffffff",
                }}
            />
            <span
                style={{
                    fontSize: 16,
                    fontWeight: 800,
                    letterSpacing: 2,
                }}
            >
                AXIS BANK
            </span>
        </div>
    );
}

function AxisGlobe() {
    return (
        <div
            style={{
                position: "absolute",
                right: 18,
                top: 22,
                width: 160,
                height: 160,
                borderRadius: "50%",
                background:
                    "radial-gradient(circle at 36% 40%, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 38%, rgba(0,0,0,0.72) 70%), linear-gradient(135deg, rgba(122,122,122,0.45), rgba(15,15,15,0.2))",
                boxShadow: "inset -18px -12px 28px rgba(0,0,0,0.58)",
                opacity: 0.98,
            }}
        >
            <svg
                viewBox="0 0 160 160"
                style={{ position: "absolute", inset: 0, opacity: 0.48 }}
            >
                {Array.from({ length: 7 }).map((_, index) => (
                    <ellipse
                        key={`lat-${index}`}
                        cx="80"
                        cy="80"
                        rx="72"
                        ry={14 + index * 9}
                        stroke="#c9c9c9"
                        strokeWidth="0.7"
                        fill="none"
                    />
                ))}
                {Array.from({ length: 6 }).map((_, index) => (
                    <ellipse
                        key={`lng-${index}`}
                        cx="80"
                        cy="80"
                        rx={12 + index * 10}
                        ry="72"
                        stroke="#c9c9c9"
                        strokeWidth="0.7"
                        fill="none"
                    />
                ))}
            </svg>
            <div
                style={{
                    position: "absolute",
                    right: 22,
                    top: 12,
                    width: 78,
                    height: 134,
                    borderRadius: "42% 48% 45% 52%",
                    background:
                        "linear-gradient(165deg, rgba(238,35,119,0.92), rgba(104,8,55,0.78))",
                    clipPath:
                        "polygon(39% 0, 77% 12%, 64% 28%, 87% 40%, 67% 58%, 88% 77%, 57% 100%, 32% 79%, 42% 62%, 19% 45%, 34% 25%, 22% 9%)",
                    filter: "drop-shadow(0 0 6px rgba(231,31,113,0.34))",
                }}
            />
        </div>
    );
}

function Mandala() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 260 210"
            style={{
                position: "absolute",
                left: -28,
                top: -14,
                width: 230,
                height: 210,
                opacity: 0.22,
            }}
        >
            {Array.from({ length: 8 }).map((_, index) => (
                <circle
                    key={index}
                    cx="88"
                    cy="100"
                    r={22 + index * 12}
                    fill="none"
                    stroke="#8ee6ff"
                    strokeWidth="1"
                />
            ))}
            {Array.from({ length: 18 }).map((_, index) => {
                const angle = (index * Math.PI * 2) / 18;
                const x = 88 + Math.cos(angle) * 76;
                const y = 100 + Math.sin(angle) * 76;
                return (
                    <path
                        key={index}
                        d={`M88 100 L${x.toFixed(1)} ${y.toFixed(1)}`}
                        stroke="#8ee6ff"
                        strokeWidth="0.8"
                    />
                );
            })}
        </svg>
    );
}

function HdfcLogo() {
    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid rgba(255,255,255,0.8)",
                padding: "3px 8px 3px 4px",
                fontSize: 12,
                fontWeight: 900,
                letterSpacing: 0.7,
                background: "rgba(255,255,255,0.08)",
            }}
        >
            <span
                style={{
                    width: 18,
                    height: 18,
                    display: "inline-block",
                    background:
                        "linear-gradient(90deg, #e31b23 0 30%, #ffffff 30% 70%, #164a9b 70% 100%)",
                    border: "1px solid #ffffff",
                    boxShadow: "inset 0 0 0 5px #ffffff",
                }}
            />
            HDFC BANK
        </div>
    );
}

function HdfcMark() {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 220 145"
            style={{
                position: "absolute",
                right: 28,
                top: 48,
                width: 190,
                height: 130,
                opacity: 0.88,
            }}
        >
            <g fill="none" stroke="#c5a059" strokeWidth="18" strokeLinejoin="miter">
                <path d="M58 38 L110 10 L162 38" />
                <path d="M58 106 L110 134 L162 106" />
                <path d="M44 48 L12 72 L44 96" />
                <path d="M176 48 L208 72 L176 96" />
                <path d="M82 72 L110 56 L138 72 L110 88 Z" fill="#c5a059" strokeWidth="4" />
            </g>
        </svg>
    );
}

function IciciLogo() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
                style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#f05a28",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 900,
                    fontStyle: "italic",
                }}
            >
                i
            </span>
            <span style={{ fontSize: 15, fontWeight: 900 }}>ICICI Bank</span>
        </div>
    );
}


function NetworkLogo({ brand, theme }: { brand: string; theme: Theme }) {
    const normalizedBrand = normalize(brand);

    let logoSrc = "/logos/visa.png";

    if (normalizedBrand.includes("visa")) {
        logoSrc = "/logos/visa.png";
    } else if (normalizedBrand.includes("amex") || normalizedBrand.includes("american")) {
        logoSrc = "/logos/amex.png";
    } else if (normalizedBrand.includes("master")) {
        logoSrc = "/logos/mastercard.png";
    } else if (normalizedBrand.includes("rupay")) {
        logoSrc = "/logos/rupay.png";
    } else if (theme === "axis") {
        logoSrc = "/logos/visa.png";
    } else if (theme === "sbi") {
        logoSrc = "/logos/rupay.png";
    } else if (theme === "icici") {
        logoSrc = "/logos/mastercard.png";
    } else if (theme === "hdfc") {
        logoSrc = "/logos/visa.png";
    }

    return (
        <img
            src={logoSrc}
            alt={brand || "Card Network"}
            style={{
                width: 56,
                height: 32,
                objectFit: "contain",
                filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.28))",
            }}
        />
    );
}


export function CreditCard({
    brand,
    issuerBank,
    lastFour,
    expiryMonth,
    expiryYear,
    userName = "CARDHOLDER",
}: CreditCardProps) {
    const theme = resolveTheme(issuerBank);
    const last4 = safeLastFour(lastFour);
    const expiry = formatExpiry(expiryMonth, expiryYear);
    const maskedNumber = `•••• •••• •••• ${last4}`;
    const holderName = userName.trim().toUpperCase() || "CARDHOLDER";

    const cardStyles: Record<Theme, CSSProperties> = {
        axis: {
            background: "#0a0a0a",
        },
        sbi: {
            background: "linear-gradient(135deg, #004080 0%, #001a33 100%)",
        },
        hdfc: {
            background: "#0a4e70",
        },
        icici: {
            background:
                "linear-gradient(to right, #8a0f0f 0%, #3d0303 70%, #140000 100%)",
        },
        fallback: {
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        },
    };

    return (
        <div style={{ ...cardBase, ...cardStyles[theme] }}>
            {theme === "axis" && (
                <>
                    <AxisGlobe />
                    <div style={{ position: "absolute", left: 22, top: 18 }}>
                        <AxisGlyph />
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            right: 22,
                            top: 20,
                            fontSize: 20,
                            fontWeight: 900,
                            letterSpacing: 1.6,
                        }}
                    >
                        ATLAS
                    </div>
                    <Contactless left={350} top={75} />
                </>
            )}

            {theme === "sbi" && (
                <>
                    <Mandala />
                    <div
                        style={{
                            position: "absolute",
                            right: 22,
                            top: 18,
                            display: "flex",
                            alignItems: "center",
                            gap: 7,
                            fontSize: 25,
                            fontWeight: 900,
                        }}
                    >
                        <span
                            style={{
                                width: 21,
                                height: 21,
                                borderRadius: "50%",
                                background: "#2ad3ff",
                                display: "inline-block",
                                boxShadow:
                                    "inset 0 -7px 0 rgba(0,52,102,0.55)",
                            }}
                        />
                        <span>SBI</span>
                        <span style={{ color: "#47bdf2" }}>card</span>
                    </div>
                    <Contactless left={350} top={75} />
                </>
            )}

            {theme === "hdfc" && (
                <>
                    <HdfcMark />
                    <Contactless left={350} top={75} />
                    <div style={{ position: "absolute", right: 22, top: 22 }}>
                        <HdfcLogo />
                    </div>
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div
                            key={index}
                            style={{
                                position: "absolute",
                                top: 0,
                                bottom: 0,
                                left: 120 + index * 28,
                                width: 1,
                                background: "rgba(255,255,255,0.14)",
                            }}
                        />
                    ))}
                </>
            )}

            {theme === "icici" && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            left: -56,
                            top: -28,
                            width: 160,
                            height: 160,
                            borderRadius: "50%",
                            background:
                                "radial-gradient(circle, rgba(255,174,72,0.95) 0%, rgba(240,90,40,0.88) 48%, rgba(240,90,40,0.12) 68%, transparent 72%)",
                            filter: "blur(0.2px)",
                        }}
                    />
                    <div style={{ position: "absolute", right: 22, top: 18 }}>
                        <IciciLogo />
                    </div>
                    <div
                        style={{
                            position: "absolute",
                            right: 44,
                            top: 82,
                            fontWeight: 800,
                        }}
                    >
                        Coral
                    </div>
                    <Contactless left={350} top={75} />
                </>
            )}

            {theme === "fallback" && (
                <>
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "radial-gradient(circle at 84% 20%, rgba(255,255,255,0.16), transparent 26%), radial-gradient(circle at 12% 90%, rgba(13,107,95,0.32), transparent 28%)",
                        }}
                    />
                    <div
                        style={{
                            position: "absolute",
                            left: 24,
                            top: 22,
                            fontSize: 18,
                            fontWeight: 900,
                            letterSpacing: 1.5,
                            ...textShadow,
                        }}
                    >
                        {issuerBank.toUpperCase() || "INSIGHTPAY"}
                    </div>
                    <Contactless left={350} top={75} />
                </>
            )}

            <Chip />

            <div
                style={{
                    position: "absolute",
                    left: 32,
                    right: 60,
                    top: theme === "hdfc" ? 112 : 118,
                    fontFamily:
                        '"Courier New", "SFMono-Regular", Consolas, monospace',
                    fontSize: 21,
                    fontWeight: 700,
                    letterSpacing: 2.4,
                    whiteSpace: "nowrap",
                    ...textShadow,
                }}
            >
                {maskedNumber}
            </div>

            <div
                style={{
                    position: "absolute",
                    left: 32,
                    bottom: 24,
                    fontFamily:
                        '"Courier New", "SFMono-Regular", Consolas, monospace',
                    fontSize: 16,
                    fontWeight: 700,
                    letterSpacing: 1.6,
                    maxWidth: 180,
                    ...textShadow,
                }}
            >
                {holderName}
            </div>

            <div
                style={{
                    position: "absolute",
                    left: 210,
                    bottom: 45,
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: 0.6,
                    opacity: 0.82,
                }}
            >
                VALID THRU
            </div>
            <div
                style={{
                    position: "absolute",
                    left: 210,
                    bottom: 24,
                    fontFamily:
                        '"Courier New", "SFMono-Regular", Consolas, monospace',
                    fontSize: 17,
                    fontWeight: 800,
                    letterSpacing: 1.2,
                    ...textShadow,
                }}
            >
                {expiry}
            </div>

            <div
                style={{
                    position: "absolute",
                    right: 32,
                    bottom: theme === "icici" ? 20 : 18,
                    ...textShadow,
                }}
            >
                <NetworkLogo brand={brand} theme={theme} />
            </div>
        </div>
    );
}

export default CreditCard;
