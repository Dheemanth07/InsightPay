import type { ReactNode } from "react";

export interface SkeletonProps {
    width?: string;
    height?: string;
    rounded?: string;
    className?: string;
}

export function Skeleton({
    width = "w-full",
    height = "h-4",
    rounded = "rounded-md",
    className = "",
}: SkeletonProps): ReactNode {
    return (
        <div
            className={`animate-pulse bg-[#e2e8f0] ${width} ${height} ${rounded} ${className}`}
        />
    );
}
