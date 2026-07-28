import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { loginUser } from "../auth.api";
import { useAuth } from "../auth.context";

export function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user, loading, login } = useAuth();

    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard");
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!email || !password) {
            setError("All fields are required");
            return;
        }

        try {
            setError("");
            setIsSubmitting(true);
            await loginUser({ email, password });

            await login();
            toast.success("Welcome back! You're logged in.");
            navigate("/dashboard");
        } catch (err) {
            const message = getApiErrorMessage(
                err,
                "Login failed. Please check your credentials.",
            );
            setError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <main className="auth-page flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="relative flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full border-3 border-[#0d6b5f]/20 border-t-[#0d6b5f] animate-spin" />
                        <div className="absolute w-5 h-5 rounded-full bg-[#0d6b5f]/10 animate-ping" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-bold text-gray-800 tracking-wide">InsightPay</h3>
                        <p className="text-xs text-gray-500 font-medium animate-pulse">Verifying secure session...</p>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <div>
                    <h1>Login</h1>
                    <p>Access your InsightPay account.</p>
                </div>

                {error && <p className="error-text">{error}</p>}

                <label>
                    Email
                    <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </label>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Logging in..." : "Login"}
                </button>

                <p>
                    New here? <Link to="/signup">Create an account</Link>
                </p>
            </form>
        </main>
    );
}
