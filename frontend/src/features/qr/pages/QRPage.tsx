import { useEffect, useState } from "react";
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
    const [pollingRef, setPollingRef] = useState<number | null>(null);
    const [received, setReceived] = useState(false);
    const [receivedAmount, setReceivedAmount] = useState<number | null>(null);

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

            // start polling status for receiver to see payment
            if (pollingRef) window.clearInterval(pollingRef);
            const intervalId = window.setInterval(async () => {
                try {
                    const statusResp = await getQrStatus(
                        response.data.reference,
                    );
                    if (statusResp.data?.status === "SUCCESS") {
                        // stop polling
                        clearInterval(intervalId);
                        setPollingRef(null);
                        // set in-UI received state so receiver sees blue tick
                        setReceived(true);
                        setReceivedAmount(statusResp.data.amount ?? null);
                        // auto-hide after a short duration
                        setTimeout(() => setReceived(false), 6000);
                    }
                } catch (e) {
                    // ignore polling errors
                }
            }, 2000);
            setPollingRef(intervalId);
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to generate QR"));
        } finally {
            setLoading(false);
        }
    };

    const handleValidateQR = async () => {
        if (!qrData.trim()) {
            setError("QR data is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await validateQR(qrData);
            // after validation, move to sender confirmation flow
            setSendAmount(String(response.data.amount));
            setSendReceiverId(response.data.receiverId);
            setValidatedQR({ ...response.data, isValid: true });
            setStep("confirm");
        } catch (err) {
            setError(getApiErrorMessage(err, "Failed to validate QR"));
        } finally {
            setLoading(false);
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
            alert("Payment successful!");
        } catch (err) {
            setError(getApiErrorMessage(err, "Payment failed"));
        } finally {
            setLoading(false);
        }
    };

    const handleScanDetected = async (data: string) => {
        // fill qrData and validate with normalization attempts
        setShowScanner(false);
        setQrData(data);
        setLoading(true);

        const normalizeCandidates = () => {
            const cands: string[] = [];
            const raw = data?.trim() || "";
            cands.push(raw);

            // strip wrapping quotes
            if (
                (raw.startsWith('\"') && raw.endsWith('\"')) ||
                (raw.startsWith("'") && raw.endsWith("'"))
            ) {
                cands.push(raw.slice(1, -1));
            }

            // attempt decodeURIComponent
            try {
                const dec = decodeURIComponent(raw);
                if (dec && dec !== raw) cands.push(dec);
            } catch (e) {
                // ignore
            }

            // common HTML entities
            const htmlUnescaped = raw
                .replace(/&quot;|&#34;/g, '"')
                .replace(/&amp;/g, "&");
            if (htmlUnescaped !== raw) cands.push(htmlUnescaped);

            // try JSON.parse then re-stringify to normalize escaping
            try {
                const parsed = JSON.parse(raw);
                const re = JSON.stringify(parsed);
                if (re !== raw) cands.push(re);
            } catch (e) {
                // ignore
            }

            // unique
            return Array.from(new Set(cands));
        };

        const candidates = normalizeCandidates();
        let lastErr: any = null;
        for (const candidate of candidates) {
            try {
                const resp = await validateQR(candidate);
                // success
                setValidatedQR({ ...resp.data, isValid: true });
                setSendAmount(String(resp.data.amount));
                setSendReceiverId(resp.data.receiverId);
                setQrData(candidate);
                setStep("confirm");
                setLoading(false);
                return;
            } catch (err) {
                lastErr = err;
                // if backend indicates tampered/expired, stop trying other normalizations
                const msg =
                    (err as any)?.response?.data?.message ||
                    (err as any)?.message ||
                    "";
                if (/tampered|invalid|expired|not found/i.test(msg)) {
                    break;
                }
                // otherwise continue trying next candidate
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

    useEffect(() => {
        return () => {
            if (pollingRef) clearInterval(pollingRef);
        };
    }, [pollingRef]);

    return (
        <main className="app-page">
            <header className="page-header">
                <div>
                    <p className="eyebrow">QR Payment</p>
                    <h1>Generate & Confirm QR Payments</h1>
                </div>
            </header>

            {error && <p className="error-text">{error}</p>}

            <div
                style={{
                    display: "flex",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                }}
            >
                <button
                    type="button"
                    className="primary-link"
                    onClick={() => {
                        setShowScanner(true);
                        setStep("scan");
                    }}
                >
                    Send Money
                </button>
                <button
                    type="button"
                    className="primary-link"
                    onClick={() => {
                        setStep("generate");
                        setShowScanner(false);
                    }}
                >
                    Receive Payment
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

            {step === "generate" && (
                <section className="panel">
                    <h2>Generate QR Code</h2>
                    <label>
                        Amount
                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleGenerateQR}
                        disabled={loading}
                    >
                        {loading ? "Generating..." : "Generate QR"}
                    </button>
                </section>
            )}

            {step === "validate" && generatedQR && (
                <section className="panel">
                    <h2>QR Generated</h2>
                    {received && (
                        <div className="qr-received">
                            <div className="check">✓</div>
                            <div className="text">
                                Payment received: INR {receivedAmount}
                            </div>
                        </div>
                    )}
                    <p>Amount: INR {generatedQR.amount}</p>
                    <p>
                        Expires:{" "}
                        {new Date(generatedQR.expiresAt).toLocaleString()}
                    </p>
                    <div className="qr-card">
                        <img
                            src={generatedQR.qrImage}
                            alt="Generated QR code"
                        />
                    </div>
                    <label>
                        QR Data
                        <textarea
                            value={qrData}
                            onChange={(e) => setQrData(e.target.value)}
                            placeholder="Paste full QR payload or scan"
                            rows={4}
                        />
                    </label>
                    <div className="button-row">
                        <button
                            type="button"
                            onClick={() =>
                                navigator.clipboard.writeText(
                                    generatedQR.qrData,
                                )
                            }
                            className="secondary-button"
                        >
                            Copy QR payload
                        </button>
                        <button
                            type="button"
                            onClick={handleValidateQR}
                            disabled={loading}
                        >
                            {loading ? "Validating..." : "Validate QR"}
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
        </main>
    );
}
