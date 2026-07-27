import { Card, DonutChart } from "@tremor/react";
import type { CategoryData } from "../dashboard.types";

const dataFormatter = (number: number) => {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(number);
};

const CATEGORY_COLORS: Record<string, { hex: string; tremor: string }> = {
    "Bills": { hex: "#3b82f6", tremor: "blue" },
    "Entertainment": { hex: "#f43f5e", tremor: "rose" },
    "Food": { hex: "#a855f7", tremor: "purple" },
    "People": { hex: "#6366f1", tremor: "indigo" },
    "Travel": { hex: "#10b981", tremor: "emerald" },
    "Transport": { hex: "#64748b", tremor: "slate" },
    "Other": { hex: "#f59e0b", tremor: "amber" },
    "Shopping": { hex: "#14b8a6", tremor: "teal" },
    "Uncategorized": { hex: "#6b7280", tremor: "gray" }
};

interface TooltipPayloadItem {
    payload: CategoryData;
    color?: string;
}

const customTooltip = (props: { active?: boolean; payload?: TooltipPayloadItem[] }, totalSpent: number) => {
    const { payload, active } = props;
    if (!active || !payload || payload.length === 0) return null;

    const data = payload[0].payload;
    const categoryColor = CATEGORY_COLORS[data.name]?.hex || "#9ca3af";
    const percentage = totalSpent > 0 ? ((data.amount / totalSpent) * 100).toFixed(1) : "0";

    return (
        <div className="rounded-xl bg-white p-3 shadow-xl border border-[#e8ecf0] flex items-center gap-3">
            <div
                className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: categoryColor }}
            />
            <div className="flex flex-col">
                <span className="text-sm font-bold text-[#0f1419]">{data.name}</span>
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold text-[#0d6b5f]">{percentage}%</span>
                    <span className="text-[#64748b]">({dataFormatter(data.amount)})</span>
                </div>
            </div>
        </div>
    );
};

type SpendingAnalyticsProps = {
    data: CategoryData[];
};

export function SpendingAnalytics({ data }: SpendingAnalyticsProps) {

    const sortedData = [...data].sort((a, b) => b.amount - a.amount);

    const donutColors = sortedData.map(
        (item) => CATEGORY_COLORS[item.name]?.tremor || "gray"
    );

    const totalSpent = sortedData.reduce((acc, item) => acc + item.amount, 0);
    const topCategory = sortedData[0];
    const topPercentage = totalSpent > 0 && topCategory ? ((topCategory.amount / totalSpent) * 100).toFixed(1) : "0";

    return (
        <Card className="w-full h-full flex flex-col justify-between bg-white ring-1 ring-gray-100 border-0 rounded-[28px] p-6 shadow-sm">
            <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Spending Analytics</h3>
                <p className="text-sm text-gray-500 mb-6">Distribution of expenses by category (last 30 days)</p>
                {sortedData.length === 0 ? (
                    <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
                        <p className="text-sm text-gray-500">No expense data available for the last 30 days</p>
                    </div>
                ) : (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mt-4">
                        <DonutChart
                            className="h-44 w-44"
                            data={sortedData}
                            category="amount"
                            index="name"
                            variant="donut"
                            colors={donutColors}
                            valueFormatter={dataFormatter}
                            customTooltip={(props) => customTooltip(props, totalSpent)}
                        />
                        <ul className="flex flex-col gap-3 w-full md:w-1/2">
                            {sortedData.map((item) => {
                                const dotColor = CATEGORY_COLORS[item.name]?.hex || "#9ca3af";
                                return (
                                    <li key={item.name} className="flex items-center justify-between gap-2 text-sm text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
                                            <span className="text-sm text-gray-700">{item.name}</span>
                                        </div>
                                        <span className="text-sm text-gray-500 font-medium">{dataFormatter(item.amount)}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {sortedData.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="p-3.5 rounded-2xl bg-[#f8fafb] border border-[#e8ecf0]">
                            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Daily Average</p>
                            <p className="text-base font-extrabold text-[#0f1419] mt-0.5">
                                ₹{Intl.NumberFormat("en-IN").format(Math.round(totalSpent / 30))}<span className="text-xs font-normal text-[#64748b]"> / day</span>
                            </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#f8fafb] border border-[#e8ecf0]">
                            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Top Category</p>
                            <p className="text-base font-extrabold text-[#0f1419] mt-0.5 truncate">
                                {topCategory.name} <span className="text-xs font-semibold text-[#0d6b5f]">({topPercentage}%)</span>
                            </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#f8fafb] border border-[#e8ecf0]">
                            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Active Categories</p>
                            <p className="text-base font-extrabold text-[#0f1419] mt-0.5">
                                {sortedData.length} <span className="text-xs font-normal text-[#64748b]">tracked</span>
                            </p>
                        </div>
                        <div className="p-3.5 rounded-2xl bg-[#f8fafb] border border-[#e8ecf0]">
                            <p className="text-[11px] font-semibold text-[#64748b] uppercase tracking-wider">Monthly Spending</p>
                            <p className="text-base font-extrabold text-[#0f1419] mt-0.5">
                                {dataFormatter(totalSpent)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {sortedData.length > 0 && topCategory && (
                <div className="mt-6 p-4 rounded-2xl bg-[#fffbeb] border border-[#fde68a] text-xs font-medium text-[#b45309] flex items-start gap-2.5">
                    <div className="leading-relaxed">
                        <strong className="font-bold mr-1">Top Category Insight:</strong>
                        Category "{topCategory.name}" accounts for {topPercentage}% of your recent spending ({dataFormatter(topCategory.amount)}).
                    </div>
                </div>
            )}
        </Card>
    );
}
