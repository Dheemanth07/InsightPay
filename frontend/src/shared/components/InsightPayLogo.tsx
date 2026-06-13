import React from "react";

export function InsightPayLogo({ className, ...props }: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="64 64 384 384"
            fill="none"
            className={className}
            style={{ transform: "translateY(-2.5px)", ...props.style }}
            {...props}
        >
            {/* Green Dot (Insight) */}
            <circle cx="187" cy="106" r="26" fill="#0d6b5f" />
            
            {/* Green Stem (I) */}
            <path d="M 161,168 h 52 v 90 a 52,52 0 0 1 -52,52 z" fill="#0d6b5f" />
            
            {/* Dark Slate Shape (P) */}
            <path d="M 213,168 H 281 A 70,70 0 0 1 351,238 A 70,70 0 0 1 281,308 H 213 V 432 H 161 V 330 A 52,52 0 0 1 213,278 V 168 Z M 213,220 V 256 H 281 A 18,18 0 0 0 281,220 H 213 Z" fill="#0f1419" />
        </svg>
    );
}
