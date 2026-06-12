import type { PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "../features/auth/AuthProvider";

export function AppProviders({ children }: PropsWithChildren) {
    return (
        <BrowserRouter>
            <AuthProvider>
                {children}
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: "#ffffff",
                            color: "#172026",
                            borderRadius: "12px",
                            border: "1px solid #dce4e8",
                            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                            padding: "12px 16px",
                            fontSize: "14px",
                            fontWeight: 600,
                        },
                        success: {
                            iconTheme: {
                                primary: "#0d6b5f",
                                secondary: "#ffffff",
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: "#b42318",
                                secondary: "#ffffff",
                            },
                        },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}
