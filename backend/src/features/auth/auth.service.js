import bcrypt from "bcrypt";
import { signinToken } from "../../utils/jwt.js";
import { seedDefaultCategories } from "../../utils/category.js";
import {
    createUser,
    findUserByEmail,
    findUserProfileById,
    getFrequentContacts,
    getUserTxPin,
    searchUsers,
    updateTxPin,
} from "./auth.repository.js";

export const registerUser = async ({ name, email, password }) => {
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        const error = new Error("User already exists with this email");
        error.statusCode = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser({ name, email, password: hashedPassword });

    await seedDefaultCategories(user.id);

    return user;
};

export const loginUser = async ({ email, password }) => {
    const user = await findUserByEmail(email);
    const isMatch = user ? await bcrypt.compare(password, user.password) : false;

    if (!isMatch) {
        const error = new Error("Invalid email or password");
        error.statusCode = 401;
        throw error;
    }

    const token = signinToken({ id: user.id, email: user.email });
    const { password: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
};

export const setupTxPin = async (userId, pin) => {
    if (!/^\d{6}$/.test(pin)) {
        const error = new Error("PIN must be exactly 6 digits.");
        error.statusCode = 400;
        throw error;
    }
    const user = await findUserProfileById(userId);
    const hashedPin = await bcrypt.hash(pin, 10);
    const cleanEmailName = user?.email ? user.email.split("@")[0].replace(/[^a-z0-9]/g, "") : "user";
    const upiId = user?.upiId || `${cleanEmailName}@insightpay`;

    await updateTxPin(userId, hashedPin, upiId);
    return { message: "Transaction PIN set successfully", upiId };
};

export const verifyTxPin = async (userId, pin) => {
    if (!pin || !/^\d{6}$/.test(String(pin))) {
        const error = new Error("Transaction PIN is required and must be 6 digits.");
        error.statusCode = 400;
        throw error;
    }
    const user = await getUserTxPin(userId);
    if (!user || !user.txPin) {
        const error = new Error("Transaction PIN not set. Please set up a 6-digit PIN in your security settings first.");
        error.statusCode = 400;
        throw error;
    }
    const isMatch = await bcrypt.compare(String(pin), user.txPin);
    if (!isMatch) {
        const error = new Error("Invalid Transaction PIN.");
        error.statusCode = 401;
        throw error;
    }
    return true;
};


export const getUserProfile = (userId) => {
    return findUserProfileById(userId);
};

export const getFrequentContactsList = (userId) => {
    return getFrequentContacts(userId);
};

export const searchUsersList = (currentUserId, query) => {
    return searchUsers(currentUserId, query);
};
