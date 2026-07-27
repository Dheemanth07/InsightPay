import React, { useEffect, useState } from "react";

type RateData = {
    base: string;
    rates: Record<string, number>;
};

const SUPPORTED_CURRENCIES = [
    { code: "INR", name: "Indian Rupee", symbol: "₹" },
    { code: "USD", name: "US Dollar", symbol: "$" },
    { code: "EUR", name: "Euro", symbol: "€" },
    { code: "GBP", name: "British Pound", symbol: "£" },
    { code: "AED", name: "UAE Dirham", symbol: "AED " },
    { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
    { code: "AUD", name: "Australian Dollar", symbol: "A$" },
    { code: "JPY", name: "Japanese Yen", symbol: "¥" },
    { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
    { code: "SAR", name: "Saudi Riyal", symbol: "SAR " },
];

export const CurrencyConverterCard: React.FC<{ walletBalance: number }> = ({ walletBalance }) => {
    const [rates, setRates] = useState<Record<string, number>>({});

    // Converter State
    const [amount, setAmount] = useState<string>("1000");
    const [fromCurr, setFromCurr] = useState<string>("INR");
    const [toCurr, setToCurr] = useState<string>("USD");

    useEffect(() => {
        let isMounted = true;
        const fetchRates = async () => {
            try {
                const res = await fetch("https://open.er-api.com/v6/latest/INR");
                if (!res.ok) throw new Error("Rates fetch failed");
                const data: RateData = await res.json();
                if (isMounted) {
                    setRates(data.rates || {});
                }
            } catch {
                if (isMounted) {
                    // Resilient fallback rates if offline
                    setRates({
                        INR: 1,
                        USD: 0.0118,
                        EUR: 0.0109,
                        GBP: 0.0093,
                        AED: 0.0435,
                        CAD: 0.0162,
                        AUD: 0.0181,
                        JPY: 1.83,
                        SGD: 0.0158,
                        SAR: 0.0443,
                    });
                }
            }
        };

        fetchRates();
    }, []);

    // Conversion Logic (rates base is INR)
    const convertValue = (val: number, from: string, to: string) => {
        if (!rates[from] || !rates[to]) return 0;
        const inINR = val / rates[from];
        return inINR * rates[to];
    };

    const numAmount = Number(amount) || 0;
    const convertedAmount = convertValue(numAmount, fromCurr, toCurr);
    const walletInTarget = convertValue(walletBalance, "INR", toCurr);
    const singleUnitRate = convertValue(1, fromCurr, toCurr);

    const fromObj = SUPPORTED_CURRENCIES.find((c) => c.code === fromCurr) || SUPPORTED_CURRENCIES[0];
    const toObj = SUPPORTED_CURRENCIES.find((c) => c.code === toCurr) || SUPPORTED_CURRENCIES[1];

    const handleSwap = () => {
        setFromCurr(toCurr);
        setToCurr(fromCurr);
    };

    return (
        <section className="panel mt-6 space-y-6 text-left">
            {/* Header */}
            <div>
                <h2 className="text-lg font-extrabold text-[#0f1419] tracking-tight m-0">
                    Live Currency Converter
                </h2>
                <p className="text-xs text-[#64748b] mt-1 m-0">
                    Convert between 10 global currencies instantly at live market exchange rates.
                </p>
            </div>

            {/* Wallet Balance Preview */}
            <div className="p-4 bg-[#f8fafb] rounded-2xl border border-[#e6eaee] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#475569]">
                        Wallet Balance Equivalent:
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-base font-extrabold text-[#0d6b5f]">
                        {toObj.symbol}
                        {walletInTarget.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-gray-500 ml-1.5">{toCurr}</span>
                </div>
            </div>

            {/* Converter Input & Output Card */}
            <div className="space-y-4 pt-1">
                {/* FROM AMOUNT FIELD */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider block">
                        Amount to Convert ({fromCurr})
                    </label>
                    <div className="flex items-center gap-3 h-12">
                        {/* Number Input Box */}
                        <div className="flex-1 min-w-0 h-full flex items-center border-2 border-gray-200 focus-within:border-[#0d6b5f] rounded-2xl bg-white px-3.5 shadow-2xs box-border m-0!">
                            <span className="pr-2 text-base font-extrabold text-[#0d6b5f] select-none shrink-0">
                                {fromObj.symbol}
                            </span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Enter amount..."
                                className="w-full h-full text-base font-extrabold text-[#0f1419] bg-transparent border-0! rounded-none! outline-none! p-0! m-0! min-w-0 box-border"
                            />
                        </div>
                        {/* Currency Select Box */}
                        <div className="w-36 sm:w-52 shrink-0 h-full">
                            <select
                                value={fromCurr}
                                onChange={(e) => setFromCurr(e.target.value)}
                                className="w-full! h-full! bg-[#f1f5f9] hover:bg-gray-200 text-[#0f1419] font-extrabold text-xs px-3 rounded-2xl border-2! border-gray-200! outline-none! cursor-pointer transition box-border m-0!"
                            >
                                {SUPPORTED_CURRENCIES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} — {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* SWAP BUTTON */}
                <div className="flex items-center justify-center -my-1">
                    <button
                        type="button"
                        onClick={handleSwap}
                        className="w-10 h-10 rounded-full border-2 border-gray-200 hover:border-[#0d6b5f] bg-white text-[#0d6b5f] hover:bg-[#e8f5f3] transition cursor-pointer flex items-center justify-center shadow-md m-0! p-0! z-10"
                        title="Swap Currencies"
                    >
                        <span className="text-base font-extrabold">⇄</span>
                    </button>
                </div>

                {/* TO AMOUNT RESULT FIELD */}
                <div className="space-y-1.5">
                    <label className="text-[11px] font-extrabold text-[#64748b] uppercase tracking-wider block">
                        Converted Result ({toCurr})
                    </label>
                    <div className="flex items-center gap-3 h-12">
                        {/* Result Output Box */}
                        <div className="flex-1 min-w-0 h-full flex items-center border-2 border-gray-200 focus-within:border-[#0d6b5f] rounded-2xl bg-white px-3.5 shadow-2xs box-border m-0!">
                            <span className="pr-2 text-base font-extrabold text-[#0d6b5f] select-none shrink-0">
                                {toObj.symbol}
                            </span>
                            <input
                                type="text"
                                readOnly
                                value={convertedAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                className="w-full h-full text-base font-extrabold text-[#0d6b5f] bg-transparent border-0! rounded-none! outline-none! p-0! m-0! min-w-0 cursor-default box-border"
                            />
                        </div>
                        {/* Currency Select Box */}
                        <div className="w-36 sm:w-52 shrink-0 h-full">
                            <select
                                value={toCurr}
                                onChange={(e) => setToCurr(e.target.value)}
                                className="w-full! h-full! bg-[#f1f5f9] hover:bg-gray-200 text-[#0f1419] font-extrabold text-xs px-3 rounded-2xl border-2! border-gray-200! outline-none! cursor-pointer transition box-border m-0!"
                            >
                                {SUPPORTED_CURRENCIES.map((c) => (
                                    <option key={c.code} value={c.code}>
                                        {c.code} — {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIVE EXCHANGE RATE DISPLAY */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-[#64748b] font-medium">Live Exchange Rate:</span>
                <span className="font-extrabold text-[#0d6b5f] bg-[#e8f5f3] border border-[#b8dbd7] px-3 py-1 rounded-full">
                    1 {fromCurr} = {singleUnitRate.toFixed(4)} {toCurr}
                </span>
            </div>
        </section>
    );
};
