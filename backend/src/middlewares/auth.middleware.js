import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        // 1. Get token exclusively from cookies
        const token = req.cookies?.token;

        // 2. Check if token is present
        if (!token)
            return res
                .status(401)
                .json({ message: "Authentication required" });

        // 3. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 5. Attach user info to request object
        req.user = {
            id: decoded.id
        };

        // 6. Proceed to next middleware/controller
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid token" });
    }
};
