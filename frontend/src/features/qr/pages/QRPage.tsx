import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../../shared/api/errors";
import {
    confirmQRPayment,
    generateQR,
    validateQR,
    getQrStatus,
} from "../qr.api";
import type { QRGenerated, QRValidated } from "../qr.types";
import QRScanner from "../../../shared/components/QRScanner";

export function QRPage() {
    const [amount, setAmount] = useState("");
    const [qrData, setQrData] = useState("");
    const [generatedQR, setGeneratedQR] = useState<QRGenerated | null>(null);
    const [validatedQR, setValidatedQR] = useState<QRValidated | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState<
        "generate" | "validate" | "confirm" | "scan" | "send"
    >("generate");
    const [showScanner, setShowScanner] = useState(false);
    const [sendAmount, setSendAmount] = useState("");
    const [sendReceiverId, setSendReceiverId] = useState<number | null>(null);
    const [receivedAmount, setReceivedAmount] = useState<number | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    // Auto-polling for QR status
    useEffect(() => {
        if (step !== "validate" || !generatedQR) {
            setPaymentSuccess(false);
            return;
        }

        let isMounted = true;
        const intervalId = setInterval(async () => {
            try {
                const statusResp = await getQrStatus(generatedQR.reference);
                if (!isMounted) return;

                if (statusResp.data?.status === "SUCCESS") {
                    setReceivedAmount(statusResp.data.amount ?? Number(generatedQR.amount));
                    setPaymentSuccess(true);
                    toast.success("Payment Received!");
                    clearInterval(intervalId);
                }
            } catch {
                // Ignore polling errors in background
            }
        }, 3000); // Poll every 3 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [step, generatedQR]);

    const handleGenerateQR = async () => {
        const qrAmount = Number(amount);
        if (!qrAmount || qrAmount <= 0) {
            setError("Invalid amount");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await generateQR(qrAmount);
            setGeneratedQR(response.data);
            setQrData(response.data.qrData);
            setStep("validate");
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to generate QR"));
        } finally {
            setLoading(false);
        }
    };

    const handleShareQR = async () => {
        if (!generatedQR) return;

        if (navigator.share) {
            try {
                const response = await fetch(generatedQR.qrImage);
                const blob = await response.blob();
                const file = new File([blob], `payment-qr-${generatedQR.reference}.png`, { type: blob.type });

                await navigator.share({
                    title: "InsightPay Payment QR",
                    text: `Scan this QR code to pay ₹${generatedQR.amount || amount}`,
                    files: [file],
                });
                return;
            } catch (err) {
                console.error("Web Share failed, falling back to download:", err);
            }
        }

        // Fallback: Download QR as image
        try {
            const link = document.createElement("a");
            link.href = generatedQR.qrImage;
            link.download = `payment-qr-${generatedQR.reference}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("QR code downloaded successfully!");
        } catch (err) {
            console.error("Download failed:", err);
            toast.error("Failed to share or download QR code.");
        }
    };



    const handleConfirmPayment = async () => {
        if (!qrData.trim()) {
            setError("QR data is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            if (!sendReceiverId) throw new Error("Missing receiver");

            await confirmQRPayment(qrData);

            setAmount("");
            setQrData("");
            setGeneratedQR(null);
            setValidatedQR(null);
            setSendAmount("");
            setSendReceiverId(null);
            setStep("generate");
            setShowScanner(false);
            toast.success("Payment sent! That was quick.");
        } catch (err) {
            setError(getApiErrorMessage(err, "Payment failed"));
        } finally {
            setLoading(false);
        }
    };

    const handleScanDetected = async (data: string) => {
        setShowScanner(false);
        setQrData(data);
        setLoading(true);

        const normalizeCandidates = () => {
            const cands: string[] = [];
            const raw = data?.trim() || "";
            cands.push(raw);

            if (
                (raw.startsWith('"') && raw.endsWith('"')) ||
                (raw.startsWith("'") && raw.endsWith("'"))
            ) {
                cands.push(raw.slice(1, -1));
            }

            try {
                const dec = decodeURIComponent(raw);
                if (dec && dec !== raw) cands.push(dec);
            } catch {
                // ignore
            }

            const htmlUnescaped = raw
                .replace(/&quot;|&#34;/g, '"')
                .replace(/&amp;/g, "&");
            if (htmlUnescaped !== raw) cands.push(htmlUnescaped);

            try {
                const parsed = JSON.parse(raw);
                const re = JSON.stringify(parsed);
                if (re !== raw) cands.push(re);
            } catch {
                // ignore
            }

            return Array.from(new Set(cands));
        };

        const candidates = normalizeCandidates();
        let lastErr: unknown = null;
        for (const candidate of candidates) {
            try {
                const resp = await validateQR(candidate);
                setValidatedQR({ ...resp.data, isValid: true });
                setSendAmount(String(resp.data.amount));
                setSendReceiverId(resp.data.receiverId);
                setQrData(candidate);
                setStep("confirm");
                setLoading(false);
                return;
            } catch (err) {
                lastErr = err;
                const errObj = err as { response?: { data?: { message?: string } }; message?: string };
                const msg = errObj?.response?.data?.message || errObj?.message || "";
                if (/tampered|invalid|expired|not found/i.test(msg)) {
                    break;
                }
            }
        }

        setError(
            getApiErrorMessage(
                lastErr || new Error("Failed to validate QR"),
                "Failed to validate QR",
            ),
        );
        setStep("generate");
        setLoading(false);
    };

    return (
        <main className="app-page">
            <div className="max-w-md mx-auto w-full flex flex-col gap-6">
                <header className="page-header" style={{ justifyContent: "center", textAlign: "center" }}>
                    <div>
                        <p className="eyebrow">QR Payment</p>
                        <h1 style={{ fontSize: "1.6rem" }}>Generate &amp; Confirm QR Payments</h1>
                    </div>
                </header>

                {error && <p className="error-text">{error}</p>}

                {/* Segmented Control Toggle */}
                <div className="flex p-1 rounded-lg w-full" style={{ backgroundColor: "#e5e7eb" }}>
                    <button
                        type="button"
                        onClick={() => {
                            setStep("generate");
                            setShowScanner(false);
                            setPaymentSuccess(false);
                        }}
                        style={{
                            flex: 1,
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.18s ease",
                            backgroundColor: !(step === "scan" || showScanner) ? "#ffffff" : "transparent",
                            color: !(step === "scan" || showScanner) ? "#065f46" : "#6b7280",
                            boxShadow: !(step === "scan" || showScanner) ? "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)" : "none",
                        }}
                    >
                        Receive Payment
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setShowScanner(true);
                            setStep("scan");
                        }}
                        style={{
                            flex: 1,
                            padding: "0.5rem 1rem",
                            borderRadius: "6px",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.18s ease",
                            backgroundColor: (step === "scan" || showScanner) ? "#ffffff" : "transparent",
                            color: (step === "scan" || showScanner) ? "#065f46" : "#6b7280",
                            boxShadow: (step === "scan" || showScanner) ? "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)" : "none",
                        }}
                    >
                        Send Money
                    </button>
                </div>

                {showScanner && (
                    <section className="panel">
                        <h2>Scan QR to Send</h2>
                        <QRScanner
                            onDetected={(data) => handleScanDetected(data)}
                            onClose={() => setShowScanner(false)}
                        />
                    </section>
                )}

                {/* Payment Success View */}
                {paymentSuccess && (
                    <section className="panel flex flex-col items-center text-center bg-emerald-50 border border-emerald-200 p-8 rounded-2xl animate-fade-in">
                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl mb-4 shadow-sm">
                            ✓
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-900 mb-2">Payment Received!</h2>
                        <p className="text-emerald-700 text-lg mb-6">
                            Received ₹{Number(receivedAmount ?? amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} successfully.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setPaymentSuccess(false);
                                setGeneratedQR(null);
                                setAmount("");
                                setStep("generate");
                            }}
                            className="px-6 py-2.5 bg-[#0d6b5f] hover:bg-[#094d45] text-white font-bold rounded-xl transition-colors duration-200"
                        >
                            Done
                        </button>
                    </section>
                )}

                {step === "generate" && !paymentSuccess && (
                    <section className="panel">
                        <h2>Generate QR Code</h2>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Amount
                            <div style={{ position: "relative", marginTop: "0.25rem" }}>
                                <span style={{
                                    position: "absolute",
                                    left: "0.85rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#6b7280",
                                    fontWeight: 600,
                                    pointerEvents: "none",
                                    zIndex: 1,
                                    lineHeight: 1,
                                }}>
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    style={{ paddingLeft: "2rem", marginBottom: 0 }}
                                />
                            </div>
                        </label>
                        <button
                            type="button"
                            onClick={handleGenerateQR}
                            disabled={loading}
                            className="w-full mt-4"
                        >
                            {loading ? "Generating..." : "Generate QR"}
                        </button>
                    </section>
                )}

                {step === "validate" && generatedQR && !paymentSuccess && (
                    <section className="panel flex flex-col items-center text-center">
                        <h2 className="text-xl font-bold mb-4">Scan to Pay</h2>
                        
                        <div className="mb-4">
                            <p className="text-3xl font-extrabold text-[#0d6b5f]">
                                ₹{Number(generatedQR.amount || amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                Expires: {new Date(generatedQR.expiresAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "numeric" })}
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center mb-4">
                            <img
                                src={generatedQR.qrImage}
                                alt="Generated QR code"
                                style={{ display: "block", width: 192, height: 192, border: "none", borderRadius: 0 }}
                            />
                        </div>

                        <div className="flex items-center justify-center gap-2 text-gray-500 text-xs mb-6">
                            <svg className="animate-spin h-4 w-4 text-[#0d6b5f]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Waiting for payment...</span>
                        </div>

                        <div className="w-full flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={handleShareQR}
                                className="w-full py-3 bg-[#0d6b5f] hover:bg-[#094d45] text-white font-bold rounded-xl transition-colors duration-200"
                            >
                                Share QR Code
                            </button>
                            
                            <button
                                type="button"
                                onClick={() => {
                                    setGeneratedQR(null);
                                    setStep("generate");
                                }}
                                style={{
                                    width: "100%",
                                    padding: "0.75rem",
                                    borderRadius: "12px",
                                    background: "transparent",
                                    border: "1.5px solid #d1d5db",
                                    color: "#6b7280",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    fontSize: "0.95rem",
                                    transition: "border-color 0.15s, color 0.15s",
                                }}
                            >
                                Reset
                            </button>
                        </div>
                    </section>
                )}

                {step === "send" && validatedQR && (
                    <section className="panel">
                        <h2>Send Payment</h2>
                        <label>
                            Receiver ID
                            <input
                                type="number"
                                value={String(sendReceiverId || "")}
                                readOnly
                            />
                        </label>
                        <label>
                            Amount (INR)
                            <input
                                type="number"
                                min="1"
                                value={sendAmount}
                                onChange={(e) => setSendAmount(e.target.value)}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={handleConfirmPayment}
                            disabled={loading}
                        >
                            {loading ? "Processing..." : "Confirm Payment"}
                        </button>
                    </section>
                )}

                {step === "confirm" && validatedQR && (
                    <section className="panel">
                        <h2>Confirm Payment</h2>
                        <p>Amount: INR {validatedQR.amount}</p>
                        <p className="muted-panel">
                            {validatedQR.isValid
                                ? "QR is valid and ready to confirm"
                                : "QR validation failed"}
                        </p>
                        <button
                            type="button"
                            onClick={handleConfirmPayment}
                            disabled={loading || !validatedQR.isValid}
                        >
                            {loading ? "Processing..." : "Confirm Payment"}
                        </button>
                    </section>
                )}
            </div>
        </main>
    );
}
