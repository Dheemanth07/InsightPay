import { useState } from "react";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { confirmQRPayment, generateQR, validateQR } from "../qr.api";
import type {
    QRGenerated,
    QRValidated,
} from "../qr.types";

export function QRPage() {
    const [amount, setAmount] = useState("");
    const [qrData, setQrData] = useState("");
    const [generatedQR, setGeneratedQR] = useState<QRGenerated | null>(null);
    const [validatedQR, setValidatedQR] = useState<QRValidated | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [step, setStep] = useState<"generate" | "validate" | "confirm">(
        "generate",
    );

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

    const handleValidateQR = async () => {
        if (!qrData.trim()) {
            setError("QR data is required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await validateQR(qrData);
            setValidatedQR(response.data);
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
            await confirmQRPayment(qrData);
            setAmount("");
            setQrData("");
            setGeneratedQR(null);
            setValidatedQR(null);
            setStep("generate");
            alert("Payment successful!");
        } catch (err) {
            setError(getApiErrorMessage(err, "Payment failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="app-page">
            <header className="page-header">
                <div>
                    <p className="eyebrow">QR Payment</p>
                    <h1>Generate & Confirm QR Payments</h1>
                </div>
            </header>

            {error && <p className="error-text">{error}</p>}

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
                    <p>Reference: {generatedQR.reference}</p>
                    <p>Amount: INR {generatedQR.amount}</p>
                    <p>Expires: {new Date(generatedQR.expiresAt).toLocaleString()}</p>
                    <label>
                        QR Data
                        <textarea
                            value={qrData}
                            onChange={(e) => setQrData(e.target.value)}
                            placeholder="Paste QR data or scan"
                            rows={4}
                        />
                    </label>
                    <button
                        type="button"
                        onClick={handleValidateQR}
                        disabled={loading}
                    >
                        {loading ? "Validating..." : "Validate QR"}
                    </button>
                </section>
            )}

            {step === "confirm" && validatedQR && (
                <section className="panel">
                    <h2>Confirm Payment</h2>
                    <p>Reference: {validatedQR.reference}</p>
                    <p>Amount: INR {validatedQR.amount}</p>
                    <p>Receiver ID: {validatedQR.receiverId}</p>
                    <p className="muted-panel">
                        {validatedQR.isValid
                            ? "QR is valid"
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
