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

    if (loading) return <p className="page-status">Checking session...</p>;

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
