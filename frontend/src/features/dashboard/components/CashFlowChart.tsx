import { useEffect, useState } from "react";
import { BarChart, Card } from "@tremor/react";
import type { CashFlowData } from "../dashboard.types";
import { getCashflowNarrative } from "../dashboard.api";

const dataFormatter = (number: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(number);
};

type CashFlowChartProps = {
    data: CashFlowData[];
};

export function CashFlowChart({ data }: CashFlowChartProps) {
    const [narrative, setNarrative] = useState<string | null>(null);

    useEffect(() => {
        if (!data || data.length === 0) return;
        const hasActivity = data.some(d => d.Income > 0 || d.Expenses > 0);
        if (!hasActivity) return;

        getCashflowNarrative(data)
            .then(res => setNarrative(res.data.narrative ?? null))
            .catch(() => {});
    }, [data]);

    return (
        <Card className="w-full h-full flex flex-col justify-between bg-white ring-1 ring-gray-100 border-0 rounded-[28px] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Cash Flow</h3>
            <p className="text-sm text-gray-500 mb-6">Income vs Expenses over the last 6 months</p>

            <div className="flex items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium text-gray-700">Income</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-500" />
                    <span className="text-sm font-medium text-gray-700">Expenses</span>
                </div>
            </div>

            <BarChart
                className="h-80 w-full mt-4"
                data={data}
                index="month"
                categories={["Income", "Expenses"]}
                colors={["emerald", "slate"]}
                valueFormatter={dataFormatter}
                showGridLines={false}
                showLegend={false}
                yAxisWidth={80}
            />

            {narrative && (
                <div className="mt-6 p-4 rounded-2xl bg-[#e8f5f3] border border-[#b8dbd7] text-xs font-medium text-[#0d6b5f] flex items-start gap-2.5">
                    <div className="leading-relaxed">
                        <strong className="font-bold mr-1">Cashflow Analysis:</strong>
                        {narrative}
                    </div>
                </div>
            )}
        </Card>
    );
}
