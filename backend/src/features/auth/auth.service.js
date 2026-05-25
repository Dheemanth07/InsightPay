import bcrypt from "bcrypt";
import { signinToken } from "../../utils/jwt.js";
import { seedDefaultCategories } from "../../utils/category.js";
import {
    createUser,
    findUserByEmail,
    findUserProfileById,
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

export const getUserProfile = (userId) => {
    return findUserProfileById(userId);
};
