import { BarChart, Card } from "@tremor/react";
import type { CashFlowData } from "../dashboard.types";

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
    return (
        <Card className="w-full min-h-[300px] bg-white ring-1 ring-gray-100 border-0 rounded-[28px] p-8 shadow-sm">
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
        </Card>
    );
}
