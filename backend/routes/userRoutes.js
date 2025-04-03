import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";

const router = express.Router();

// 🔹 Middleware for validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// 🔹 Inscription
router.post(
    "/register",
    [
        body("name").trim().notEmpty().withMessage("Name is required"),
        body("email").isEmail().withMessage("Invalid email address"),
        body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
        validate,
    ],
    async (req, res) => {
        try {
            const { name, email, password } = req.body;

            // Check if email already exists
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use" });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = new User({ name, email, password: hashedPassword });
            await newUser.save();
            res.status(201).json({ message: "Utilisateur créé avec succès !" });
        } catch (error) {
            if (error.code === 11000) {
                return res.status(400).json({ message: "Email already in use" });
            }
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

// 🔹 Connexion
router.post(
    "/login",
    [
        body("email").isEmail().withMessage("Invalid email address"),
        body("password").notEmpty().withMessage("Password is required"),
        validate,
    ],
    async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: "Utilisateur non trouvé" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: "Mot de passe incorrect" });
            }

            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
            res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

// 🔹 Placeholder for Google Login (to be implemented)
router.post("/google-login", async (req, res) => {
    try {
        // Implement Google OAuth logic here
        res.status(501).json({ message: "Google login not implemented yet" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// 🔹 Placeholder for Facebook Login (to be implemented)
router.post("/facebook-login", async (req, res) => {
    try {
        // Implement Facebook OAuth logic here
        res.status(501).json({ message: "Facebook login not implemented yet" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;