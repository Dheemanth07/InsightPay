import { useEffect, useState } from "react";
import { getFinancialInsights } from "../dashboard.api";
import { getApiErrorMessage } from "../../../shared/api/errors";

export function FinancialRoast() {
    const [insight, setInsight] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const fetchInsight = async () => {
            try {
                setLoading(true);
                setError("");
                const res = await getFinancialInsights();
                setInsight(res.data.insight);
            } catch (err) {
                console.error("Error fetching financial insights:", err);
                setError(getApiErrorMessage(err, "Failed to load advice."));
            } finally {
                setLoading(false);
            }
        };

        void fetchInsight();
    }, []);

    if (loading) {
        return (
            <div className="mb-6 rounded-2xl border border-[#e8ecf0] bg-[#fafbfc] px-4 py-3.5 text-sm font-semibold text-[#6b7280] animate-pulse">
                Analyzing your transactions for financial insights…
            </div>
        );
    }

    if (error || !insight) {
        return null; // Gracefully hide if we hit rate limits or if it fails
    }

    return (
        <div className="mb-6 rounded-2xl border border-[#e8ecf0] bg-white px-5 py-4 text-sm shadow-[0_1px_0_rgba(15,20,25,0.04),0_12px_40px_rgba(15,20,25,0.04)] hover:scale-[1.002] transition duration-200">
            <p className="leading-relaxed text-[#374151]">
                <strong className="text-[#0d6b5f] mr-1.5 font-bold">Monthly Insight:</strong>
                {insight}
            </p>
        </div>
    );
}
