import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import multer from "multer";
import path from "path";
import User from "../models/User.js";

const router = express.Router();

// 🔹 Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// Filter files to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Not an image! Please upload only images."), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB max file size
    }
});

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
        body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long"),
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
            res.json({
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    profileImage: user.profileImage
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

// 🔹 Upload profile image
router.post(
    "/upload-image",
    upload.single("profileImage"),
    async (req, res) => {
        try {
            // req.user should come from your authentication middleware
            if (!req.user || !req.user.id) {
                return res.status(401).json({ message: "Authentication required" });
            }

            if (!req.file) {
                return res.status(400).json({ message: "Please upload an image" });
            }

            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Update user with image path
            user.profileImage = req.file.path;
            await user.save();

            res.status(200).json({
                message: "Profile image uploaded successfully",
                profileImage: user.profileImage
            });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

// 🔹 Authentication middleware - add this for protected routes
export const auth = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ message: "No authentication token, access denied" });
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: verified.id };
        next();
    } catch (error) {
        res.status(401).json({ message: "Token verification failed", error: error.message });
    }
};

// 🔹 Protected route example to update user profile with image
router.put(
    "/update-profile",
    auth,
    upload.single("profileImage"),
    async (req, res) => {
        try {
            const { name } = req.body;
            const updates = { name };

            if (req.file) {
                updates.profileImage = req.file.path;
            }

            const user = await User.findByIdAndUpdate(
                req.user.id,
                updates,
                { new: true, runValidators: true }
            ).select("-password");

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json({ message: "Profile updated successfully", user });
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