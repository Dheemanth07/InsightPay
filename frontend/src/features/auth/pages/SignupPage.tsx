import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../../../shared/api/errors";
import { registerUser } from "../auth.api";
import { useAuth } from "../auth.context";

export function SignupPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            navigate("/dashboard");
        }
    }, [user, navigate]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!name || !email || !password) {
            setError("All fields are required");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (!email.includes("@")) {
            setError("Invalid email");
            return;
        }

        try {
            setError("");
            setIsSubmitting(true);
            await registerUser({ name, email, password });
            navigate("/login");
        } catch (err) {
            setError(getApiErrorMessage(err, "Signup failed"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="auth-page">
            <form className="auth-form" onSubmit={handleSubmit}>
                <div>
                    <h1>Create Account</h1>
                    <p>Start tracking your wallet activity in one place.</p>
                </div>

                {error && <p className="error-text">{error}</p>}

                <label>
                    Name
                    <input
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                    />
                </label>

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
                        autoComplete="new-password"
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </label>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creating..." : "Create Account"}
                </button>

                <p>
                    Already registered? <Link to="/login">Login</Link>
                </p>
            </form>
        </main>
    );
}
