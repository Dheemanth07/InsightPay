import {
    getUserProfile,
    loginUser,
    registerUser,
} from "./auth.service.js";

export const register = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: "Request body is missing" });
        }

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
            });
        }

        const user = await registerUser({ name, email, password });

        return res
            .status(201)
            .json({ message: "User registered successfully", user });
    } catch (err) {
        console.error("Error during registration:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};

export const login = async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: "Request body is missing" });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const result = await loginUser({ email, password });

        return res.status(200).json({
            message: "Login successful",
            ...result,
        });
    } catch (err) {
        console.error("Login error:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};

export const getMe = async (req, res) => {
    try {
        const user = await getUserProfile(req.user.id);

        return res.status(200).json(user);
    } catch (err) {
        console.error("Error retrieving user details:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
