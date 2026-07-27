import React, { useState, useRef, useEffect } from "react";
import { Spinner } from "./Spinner";

interface TransactionPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (pin: string) => Promise<void>;
    title?: string;
    description?: string;
    actionLabel?: string;
    isSetup?: boolean;
}

export function TransactionPinModal({
    isOpen,
    onClose,
    onSubmit,
    title = "Enter Transaction PIN",
    description = "Enter your 6-digit security PIN to authorize this transaction",
    actionLabel = "Authorize Payment",
    isSetup = false,
}: TransactionPinModalProps) {
    const [pin, setPin] = useState<string[]>(Array(6).fill(""));
    const [confirmPin, setConfirmPin] = useState<string[]>(Array(6).fill(""));
    const [step, setStep] = useState<"enter" | "confirm">(isSetup ? "enter" : "enter");
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (isOpen) {
            setPin(Array(6).fill(""));
            setConfirmPin(Array(6).fill(""));
            setStep("enter");
            setError("");
            setTimeout(() => inputsRef.current[0]?.focus(), 100);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const currentDigits = step === "enter" ? pin : confirmPin;
    const setCurrentDigits = step === "enter" ? setPin : setConfirmPin;

    const handleChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...currentDigits];
        newDigits[index] = value.slice(-1);
        setCurrentDigits(newDigits);
        setError("");

        if (value && index < 5) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !currentDigits[index] && index > 0) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(pasted)) {
            setCurrentDigits(pasted.split(""));
            inputsRef.current[5]?.focus();
        }
    };

    const handleProceed = async () => {
        const fullPin = pin.join("");
        if (fullPin.length < 6) {
            setError("Please enter all 6 digits.");
            return;
        }

        if (isSetup && step === "enter") {
            setStep("confirm");
            setConfirmPin(Array(6).fill(""));
            setTimeout(() => inputsRef.current[0]?.focus(), 100);
            return;
        }

        if (isSetup && step === "confirm") {
            const confirmFull = confirmPin.join("");
            if (confirmFull !== fullPin) {
                setError("PINs do not match. Please try again.");
                setConfirmPin(Array(6).fill(""));
                inputsRef.current[0]?.focus();
                return;
            }
        }

        setSubmitting(true);
        setError("");
        try {
            await onSubmit(fullPin);
            onClose();
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || "Invalid PIN. Please try again.");
            if (!isSetup) {
                setPin(Array(6).fill(""));
                inputsRef.current[0]?.focus();
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl border border-[#e8ecf0] text-center space-y-5 relative">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                    ✕
                </button>

                <div className="w-12 h-12 rounded-full bg-[#e8f5f3] text-[#0d6b5f] flex items-center justify-center mx-auto shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <div>
                    <h3 className="text-xl font-extrabold text-[#0f1419]">
                        {isSetup ? (step === "enter" ? "Create 6-Digit PIN" : "Confirm 6-Digit PIN") : title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {isSetup ? (step === "enter" ? "Set up your secure passcode for transactions" : "Re-enter your 6-digit PIN to confirm") : description}
                    </p>
                </div>

                {/* 6 Digit Input Group */}
                <div className="flex justify-center gap-2 my-4">
                    {currentDigits.map((digit, idx) => (
                        <input
                            key={idx}
                            ref={(el) => { inputsRef.current[idx] = el; }}
                            type="password"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(idx, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(idx, e)}
                            onPaste={handlePaste}
                            disabled={submitting}
                            className="w-10 h-12 text-center text-xl font-bold rounded-xl border border-[#dce4e8] bg-[#f8fafb] focus:border-[#0d6b5f] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0d6b5f]/20 transition-all"
                        />
                    ))}
                </div>

                {error && (
                    <p className="text-xs font-semibold text-red-600 bg-red-50 py-1.5 px-3 rounded-lg">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    onClick={handleProceed}
                    disabled={submitting || currentDigits.some((d) => !d)}
                    className="w-full py-3.5 px-4 rounded-full font-bold text-sm bg-[#0d6b5f] text-white hover:bg-[#094d45] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                    {submitting ? (
                        <Spinner size="h-5 w-5" color="text-white" />
                    ) : isSetup && step === "enter" ? (
                        "Next →"
                    ) : (
                        actionLabel
                    )}
                </button>
            </div>
        </div>
    );
}
