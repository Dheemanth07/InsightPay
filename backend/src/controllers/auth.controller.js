import bcrypt from "bcrypt";
import prisma from "../prisma.js";
import { signinToken } from "../utils/jwt.js";
import { seedDefaultCategories } from "../utils/category.js";

export const register = async (req, res) => {
    try {
        // Validate request body
        if (!req.body) {
            return res.status(400).json({ message: "Request body is missing" });
        }

        const { name, email, password } = req.body;

        // 1. Check if all fields are provided
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2. Check if password is at least 6 characters long
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long",
            });
        }

        // 3. Check if user already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res
                .status(400)
                .json({ message: "User already exists with this email" });
        }

        // 4. For new user Hash the password with 'bcrypt' and salt rounds of 10
        const hashedPassword = await bcrypt.hash(password, 10);

        // 5. Create new user in the database
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            },
        });

        // 6. Seed default categories for the new user
        await seedDefaultCategories(user.id);
        // 7. Return success response
        return res
            .status(201)
            .json({ message: "User registered successfully", user });
    } catch (err) {
        console.error("Error during registration:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const login = async (req, res) => {
    try {
        // Validate request body
        if (!req.body) {
            return res.status(400).json({ message: "Request body is missing" });
        }

        const { email, password } = req.body;

        // 1. Check if all fields are provided
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // 2. Check if user exists
        const user = await prisma.user.findUnique({ where: { email } });
        const isMatch = user
            ? await bcrypt.compare(password, user.password)
            : false;

        // 3. Compare provided password with stored hashed password

        if (!isMatch) {
            return res
                .status(401)
                .json({ message: "Invalid email or password" });
        }

        // 4. Generate JWT token
        const token = signinToken({ id: user.id, email: user.email });

        const { password: _, ...userWithoutPassword } =
            user; /*Extract password from user object and rename password to _ to exclude it from the response 
        and ...userWithoutPassword will contain all user fields except password*/

        // 5. Return success response with token
        return res.status(200).json({
            message: "Login successful",
            user: userWithoutPassword,
            token,
        });
    } catch (err) {
        console.error("Login error: ", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getMe = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                balance: true,
                createdAt: true,
            },
        });

        return res.status(200).json(user);
    } catch (err) {
        console.error("Error retrieving user details:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
