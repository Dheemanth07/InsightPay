import { getUpcomingLiabilitiesForUser } from "./analytics.service.js";

export const getUpcomingLiabilities = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await getUpcomingLiabilitiesForUser(userId);
        return res.status(200).json(result);
    } catch (err) {
        console.error("Error retrieving upcoming liabilities:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};
