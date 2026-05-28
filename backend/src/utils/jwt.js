import "../config/env.js";
import jwt from "jsonwebtoken";

export const signinToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
};
