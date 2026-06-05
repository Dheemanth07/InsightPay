import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type Props = {
    onDetected: (data: string) => void;
    onClose: () => void;
};

export const QRScanner: React.FC<Props> = ({ onDetected, onClose }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const rafRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const scanningRef = useRef(true);
    const [cameraAvailable, setCameraAvailable] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                });
                streamRef.current = stream;
                if (videoRef.current) {
                    // ensure srcObject only set when element exists
                    try {
                        videoRef.current.srcObject = stream;
                        // play() can throw AbortError if the element is removed; handle gracefully
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        await videoRef.current.play();
                    } catch (playErr) {
                        // ignore play errors (AbortError when unmounted or extension interference)
                        // keep scanning running — tick will continue if possible
                        // console.warn so debugging remains possible
                        // eslint-disable-next-line no-console
                        console.warn("Camera play() error:", playErr);
                    }
                }
                tick();
            } catch (err) {
                console.error("Camera access error", err);
                // don't auto-close on mobile — allow user to upload an image instead
                setCameraAvailable(false);
            }
        };

        const tick = () => {
            // stop if no longer scanning
            if (!scanningRef.current) return;

            if (!videoRef.current || !canvasRef.current) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            // sometimes video dimensions are not ready yet
            if (video.videoWidth === 0 || video.videoHeight === 0) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            } catch (drawErr) {
                // drawing can fail if the video stream was removed; retry next frame
                // eslint-disable-next-line no-console
                console.warn("drawImage error", drawErr);
                rafRef.current = requestAnimationFrame(tick);
                return;
            }
            const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height,
            );
            const code = jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
            );
            if (code && code.data) {
                // stop scheduling further frames to avoid duplicate detections
                scanningRef.current = false;
                // notify parent
                try {
                    onDetected(code.data);
                } catch (e) {
                    // swallow errors from parent handler
                    // eslint-disable-next-line no-console
                    console.warn("onDetected handler error", e);
                }
            } else {
                rafRef.current = requestAnimationFrame(tick);
            }
        };

        start();

        return () => {
            scanningRef.current = false;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
            // clear video srcObject to fully release camera in some browsers
            if (videoRef.current) {
                try {
                    videoRef.current.pause();
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    videoRef.current.srcObject = null;
                    videoRef.current.removeAttribute("src");
                } catch (e) {
                    // ignore
                }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFile = (file?: File) => {
        if (!file || !canvasRef.current) return;
        setUploading(true);

        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
            try {
                const canvas = canvasRef.current!;
                const ctx = canvas.getContext("2d");
                if (!ctx) throw new Error("Canvas not available");
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(
                    0,
                    0,
                    canvas.width,
                    canvas.height,
                );
                const code = jsQR(
                    imageData.data,
                    imageData.width,
                    imageData.height,
                );
                if (code && code.data) {
                    onDetected(code.data);
                } else {
                    // no QR found
                    // eslint-disable-next-line no-console
                    console.warn("No QR code found in uploaded image");
                }
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error("Error processing uploaded image", e);
            } finally {
                setUploading(false);
                URL.revokeObjectURL(url);
            }
        };
        img.onerror = () => {
            setUploading(false);
            URL.revokeObjectURL(url);
        };
        img.src = url;
    };

    return (
        <div className="scanner-modal">
            <div className="scanner-controls">
                <button
                    type="button"
                    onClick={onClose}
                    className="secondary-button"
                >
                    Close
                </button>
            </div>

            {cameraAvailable ? (
                <>
                    <video
                        ref={videoRef}
                        style={{ width: "100%", borderRadius: 12 }}
                    />
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </>
            ) : (
                <section>
                    <p>
                        Camera not available or blocked. You can upload a QR
                        image instead.
                    </p>
                    <label htmlFor="qr-file-input">Upload QR Code Image:</label>
                    <input
                        id="qr-file-input"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            handleFile(
                                e.target.files ? e.target.files[0] : undefined,
                            )
                        }
                    />
                    {uploading && <p>Processing image…</p>}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </section>
            )}
        </div>
    );
};

export default QRScanner;
