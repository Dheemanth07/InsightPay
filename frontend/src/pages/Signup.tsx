import { useState } from "react";
import { registerUser } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Signup() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
            await registerUser({ name, email, password });
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Signup failed");
        }

        console.log({ name, email, password });
    };

    return (
        <form onSubmit={handleSubmit}>
            <h1>Signup</h1>

            {error && <p style={{ color: "red" }}>{error}</p>}

            <input
                placeholder="Name"
                onChange={(e) => setName(e.target.value)}
            />

            <input
                placeholder="Email"
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="Password"
                onChange={(e) => setPassword(e.target.value)}
            />

            <button type="submit">Create Account</button>
        </form>
    );
}
