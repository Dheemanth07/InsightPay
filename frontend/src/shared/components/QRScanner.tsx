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
        const currentVideo = videoRef.current;
        const start = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" },
                });
                streamRef.current = stream;
                if (currentVideo) {
                    // ensure srcObject only set when element exists
                    try {
                        currentVideo.srcObject = stream;
                        // play() can throw AbortError if the element is removed; handle gracefully
                        await currentVideo.play();
                    } catch (playErr) {
                        // ignore play errors (AbortError when unmounted or extension interference)
                        // keep scanning running — tick will continue if possible
                        // console.warn so debugging remains possible
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

            if (!currentVideo || !canvasRef.current) {
                rafRef.current = requestAnimationFrame(tick);
                return;
            }

            const video = currentVideo;
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
            if (currentVideo) {
                try {
                    currentVideo.pause();
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore
                    currentVideo.srcObject = null;
                    currentVideo.removeAttribute("src");
                } catch {
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
                    console.warn("No QR code found in uploaded image");
                }
            } catch (e) {
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
            {cameraAvailable ? (
                <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-inner">
                    <video
                        ref={videoRef}
                        className="w-full h-auto block"
                        style={{ borderRadius: 12 }}
                    />
                    {/* Visual Reticle Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* Semi-transparent dark overlay border */}
                        <div className="absolute inset-0 bg-black/40" />
                        
                        {/* Clear center square reticle */}
                        <div className="relative w-48 h-48 sm:w-64 sm:h-64 border-2 border-white/80 rounded-2xl bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] flex items-center justify-center">
                            {/* Four corner brackets to highlight the scan area */}
                            <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-md" />
                            <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-md" />
                            <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-md" />
                            <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-md" />
                            
                            <span className="text-white/80 text-xs font-bold px-3 py-1.5 bg-black/55 rounded-full select-none tracking-wider uppercase">
                                Align QR Code
                            </span>
                        </div>
                    </div>
                    {/* Close button — absolute top-right, above the overlay */}
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            position: "absolute",
                            top: "0.6rem",
                            right: "0.6rem",
                            zIndex: 20,
                            background: "rgba(0,0,0,0.55)",
                            border: "none",
                            color: "#ffffff",
                            borderRadius: "999px",
                            padding: "0.3rem 0.85rem",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            backdropFilter: "blur(4px)",
                            letterSpacing: "0.02em",
                        }}
                    >
                        Close
                    </button>
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </div>
            ) : (
                <section className="p-6 bg-white rounded-2xl border border-gray-200 text-center space-y-4 shadow-sm my-4">
                    <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-[#0f1419]">Live Camera Unavailable over HTTP</h3>
                        <p className="text-xs text-[#64748b] mt-1 max-w-sm mx-auto leading-relaxed">
                            Mobile browsers require <strong>HTTPS</strong> for live webcam access over IP. Select or take a photo of the QR code below to complete payment instantly.
                        </p>
                    </div>
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <label
                            htmlFor="qr-file-input"
                            className="h-10 px-6 inline-flex items-center justify-center gap-2 rounded-full bg-[#0d6b5f] text-white text-xs font-bold hover:bg-[#094d45] transition cursor-pointer shadow-sm border-0 m-0 box-border leading-none"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>{uploading ? "Processing Image..." : "Select or Take QR Photo"}</span>
                        </label>
                        <input
                            id="qr-file-input"
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={(e) =>
                                handleFile(
                                    e.target.files ? e.target.files[0] : undefined,
                                )
                            }
                        />
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-10 px-6 inline-flex items-center justify-center border border-gray-300 text-gray-700 bg-white rounded-full text-xs font-bold hover:bg-gray-50 transition cursor-pointer m-0 box-border leading-none"
                        >
                            Close
                        </button>
                    </div>
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                </section>
            )}
        </div>
    );
};

export default QRScanner;
