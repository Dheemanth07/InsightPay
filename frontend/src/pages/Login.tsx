import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { loginUser } from "../api/auth";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    // Extract user, loading, and the NEW login function
    const { user, loading, login } = useAuth();

    // Prevent access if already logged in
    useEffect(() => {
        if (!loading && user) {
            navigate("/dashboard");
        }
    }, [user, loading, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            setError("All fields are required");
            return;
        }

        try {
            setIsSubmitting(true);

            // 1. Call the API service
            const res = await loginUser({ email, password });

            // 2. Call the context login to sync global state
            // This calls /auth/me and sets user in state
            await login(res.data.token);

            // 3. Now navigate - the Dashboard will find the user in context!
            navigate("/dashboard");
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                    "Login failed. Please check your credentials.",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <p>Checking session...</p>;

    return (
        <form onSubmit={handleSubmit}>
            <h1>Login</h1>
            {error && <p style={{ color: "red" }}>{error}</p>}

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />

            <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login"}
            </button>
        </form>
    );
}
