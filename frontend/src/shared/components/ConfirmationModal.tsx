import type { ReactNode } from "react";
import { Spinner } from "./Spinner";

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmText?: string;
    isProcessing?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = "Delete",
    isProcessing = false,
}: ConfirmationModalProps): ReactNode {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)" }}
            onClick={onClose}
        >
            <div
                className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Warning icon */}
                <div className="flex justify-center mb-4">
                    <div
                        style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            backgroundColor: "#fef2f2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#dc2626"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            style={{ width: 24, height: 24 }}
                        >
                            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                </div>

                {/* Title */}
                <h2
                    style={{
                        textAlign: "center",
                        fontSize: "1.2rem",
                        fontWeight: 800,
                        color: "#111827",
                        marginBottom: "0.5rem",
                    }}
                >
                    {title}
                </h2>

                {/* Description */}
                <p
                    style={{
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "0.9rem",
                        lineHeight: 1.5,
                        marginBottom: "1.5rem",
                    }}
                >
                    {description}
                </p>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            flex: 1,
                            padding: "0.7rem 1rem",
                            borderRadius: "10px",
                            border: "1.5px solid #e5e7eb",
                            background: "transparent",
                            color: "#374151",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f3f4f6")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "transparent")
                        }
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className="flex items-center justify-center"
                        style={{
                            flex: 1,
                            padding: "0.7rem 1rem",
                            borderRadius: "10px",
                            border: "none",
                            background: "#dc2626",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            cursor: isProcessing ? "not-allowed" : "pointer",
                            opacity: isProcessing ? 0.65 : 1,
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                            if (!isProcessing)
                                e.currentTarget.style.backgroundColor = "#b91c1c";
                        }}
                        onMouseLeave={(e) => {
                            if (!isProcessing)
                                e.currentTarget.style.backgroundColor = "#dc2626";
                        }}
                    >
                        {isProcessing ? (
                            <Spinner size="h-5 w-5" color="text-white" />
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
