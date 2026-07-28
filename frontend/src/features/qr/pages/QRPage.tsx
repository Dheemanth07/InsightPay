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
import { TransactionPinModal } from "../../../shared/components/TransactionPinModal";

export function QRPage() {
    const [amount, setAmount] = useState("");
    const [qrData, setQrData] = useState("");
    const [generatedQR, setGeneratedQR] = useState<QRGenerated | null>(null);
    const [validatedQR, setValidatedQR] = useState<QRValidated | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState<
        "generate" | "validate" | "confirm" | "scan" | "send" | "sent_success"
    >("generate");
    const [showScanner, setShowScanner] = useState(false);
    const [sendAmount, setSendAmount] = useState("");
    const [receivedAmount, setReceivedAmount] = useState<number | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [showPinModal, setShowPinModal] = useState(false);
    const [payeeInfo, setPayeeInfo] = useState<{ name: string; upiId?: string } | null>(null);
    const [sentPaymentDetails, setSentPaymentDetails] = useState<{ amount: number; payeeName: string; reference: string } | null>(null);

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



    const handleExecutePaymentWithPin = async (pin: string) => {
        if (!qrData.trim()) {
            throw new Error("QR data is required");
        }

        const finalAmount = Number(sendAmount);
        if (!finalAmount || finalAmount <= 0) {
            throw new Error("Please enter a valid amount greater than ₹0.");
        }

        setLoading(true);
        setError("");

        try {
            const res = await confirmQRPayment(qrData, pin, finalAmount);

            setSentPaymentDetails({
                amount: finalAmount,
                payeeName: payeeInfo?.name || "Payee",
                reference: res.data.reference || `trans_${Date.now()}`,
            });

            setAmount("");
            setQrData("");
            setGeneratedQR(null);
            setValidatedQR(null);
            setSendAmount("");
            setStep("sent_success");
            setShowScanner(false);
            setShowPinModal(false);
            toast.success("Payment sent successfully!");
        } catch (err) {
            const msg = getApiErrorMessage(err, "Payment failed");
            setError(msg);
            throw new Error(msg);
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
                const validated = resp.data as QRValidated;
                setValidatedQR({ ...validated, isValid: true });
                const initialAmt = Number(validated.amount) > 0 ? String(validated.amount) : "";
                setSendAmount(initialAmt);
                setPayeeInfo({
                    name: validated.payeeName || validated.upiId || "InsightPay Payee",
                    upiId: validated.upiId,
                });
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

                {step === "sent_success" && sentPaymentDetails && (
                    <section className="panel flex flex-col items-center text-center bg-emerald-50 border border-emerald-200 p-8 rounded-2xl animate-fade-in">
                        <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white text-3xl mb-4 shadow-sm">
                            ✓
                        </div>
                        <h2 className="text-2xl font-bold text-emerald-900 mb-1">Payment Successful!</h2>
                        <p className="text-3xl font-extrabold text-[#0d6b5f] my-2">
                            ₹{Number(sentPaymentDetails.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-emerald-700 text-xs mb-6">
                            Paid to <strong>{sentPaymentDetails.payeeName}</strong>
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setSentPaymentDetails(null);
                                setStep("generate");
                            }}
                            className="px-6 py-2.5 bg-[#0d6b5f] hover:bg-[#094d45] text-white font-bold rounded-xl transition-colors duration-200 cursor-pointer"
                        >
                            Done
                        </button>
                    </section>
                )}

                {step === "confirm" && validatedQR && (
                    <section className="panel flex flex-col gap-5 p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <header className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 m-0">Confirm Payment</h2>
                                <p className="text-xs text-gray-500 m-0 mt-0.5">Review payee & amount before proceeding</p>
                            </div>
                            <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {validatedQR.isUniversalUpi ? "UPI QR" : "InsightPay QR"}
                            </span>
                        </header>

                        {/* Payee Profile Card */}
                        <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-11 h-11 rounded-full bg-[#0d6b5f] text-white flex items-center justify-center text-base font-extrabold shadow-sm flex-shrink-0">
                                {(payeeInfo?.name || "P").charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-bold text-gray-900 truncate m-0">
                                    {payeeInfo?.name || "InsightPay Merchant"}
                                </h3>
                                {payeeInfo?.upiId && (
                                    <p className="text-xs text-gray-500 font-mono truncate m-0 mt-0.5">
                                        {payeeInfo.upiId}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Amount Input */}
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                Payment Amount
                            </label>
                            <div style={{ position: "relative" }}>
                                <span style={{
                                    position: "absolute",
                                    left: "0.85rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#374151",
                                    fontWeight: 800,
                                    fontSize: "1.1rem",
                                    pointerEvents: "none",
                                    zIndex: 1,
                                }}>
                                    ₹
                                </span>
                                <input
                                    type="number"
                                    min="1"
                                    step="any"
                                    value={sendAmount}
                                    onChange={(e) => setSendAmount(e.target.value)}
                                    placeholder="0.00"
                                    style={{
                                        paddingLeft: "2.2rem",
                                        marginBottom: 0,
                                        fontWeight: 800,
                                        fontSize: "1.2rem",
                                    }}
                                />
                            </div>
                            {(!sendAmount || Number(sendAmount) <= 0) && (
                                <p className="text-xs text-amber-600 font-medium mt-1.5 m-0">
                                    Please enter an amount to transfer.
                                </p>
                            )}
                        </div>

                        <button
                            type="button"
                            disabled={!sendAmount || Number(sendAmount) <= 0 || loading}
                            onClick={() => setShowPinModal(true)}
                            className="w-full py-3.5 bg-[#0d6b5f] hover:bg-[#094d45] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-sm cursor-pointer mt-2"
                        >
                            Proceed to Pay ₹{Number(sendAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </button>
                    </section>
                )}

                <TransactionPinModal
                    isOpen={showPinModal}
                    onClose={() => setShowPinModal(false)}
                    onSubmit={handleExecutePaymentWithPin}
                    title="Enter 6-Digit PIN"
                    description={`Authorize payment of ₹${Number(sendAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })} to ${payeeInfo?.name || "Payee"}`}
                    actionLabel="Confirm & Pay"
                />
            </div>
        </main>
    );
}
