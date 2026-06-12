import {
    initiateSplit,
    paySplitShare,
    rejectSplitShare,
    getIncomingPendingSplitsForUser,
    getOutgoingSplitsForUser,
} from "./split.service.js";

export const createSplit = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const result = await initiateSplit(requesterId, req.body);
        return res.status(201).json(result);
    } catch (err) {
        console.error("Error creating split request:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};

export const settleSplit = async (req, res) => {
    try {
        const payerId = req.user.id;
        const { splitId } = req.params;
        const result = await paySplitShare(payerId, splitId);
        return res.status(200).json(result);
    } catch (err) {
        console.error("Error paying split request:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};

export const rejectSplit = async (req, res) => {
    try {
        const payerId = req.user.id;
        const { splitId } = req.params;
        const result = await rejectSplitShare(payerId, splitId);
        return res.status(200).json({ message: "Split request rejected successfully", split: result });
    } catch (err) {
        console.error("Error rejecting split request:", err);
        return res
            .status(err.statusCode || 500)
            .json({ message: err.message || "Internal server error" });
    }
};

export const getIncomingPendingSplits = async (req, res) => {
    try {
        const userId = req.user.id;
        const splits = await getIncomingPendingSplitsForUser(userId);
        return res.status(200).json({ splits });
    } catch (err) {
        console.error("Error retrieving incoming splits:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getOutgoingSplits = async (req, res) => {
    try {
        const userId = req.user.id;
        const splits = await getOutgoingSplitsForUser(userId);
        return res.status(200).json({ splits });
    } catch (err) {
        console.error("Error retrieving outgoing splits:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
