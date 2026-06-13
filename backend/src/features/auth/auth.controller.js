import {
    getUserProfile,
    loginUser,
    registerUser,
    getFrequentContactsList,
    searchUsersList as searchUsersService,
} from "./auth.service.js";
import logger from "../../utils/logger.js";

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
        logger.error({ err }, "Error during registration");
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
        logger.error({ err }, "Login error");
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
        logger.error({ err }, "Error retrieving user details");
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getUsersSuggestions = async (req, res) => {
    try {
        const users = await getFrequentContactsList(req.user.id);
        return res.status(200).json({ users });
    } catch (err) {
        logger.error({ err }, "Error retrieving suggested users");
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getUsersSearchList = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.trim().length < 2) {
            return res.status(400).json({ message: "Search query must be at least 2 characters long" });
        }

        const users = await searchUsersService(req.user.id, q.trim());
        return res.status(200).json({ users });
    } catch (err) {
        logger.error({ err }, "Error searching users");
        return res.status(500).json({ message: "Internal server error" });
    }
};
