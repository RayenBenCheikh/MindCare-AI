import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import multer from "multer";
import User from "../models/User.js";
import { sendEmail } from "../utils/emailService.js";

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
router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        // Generate username from email if name is not provided
        const username = name || email.split('@')[0];

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            name: username,
            email,
            password: hashedPassword
        });

        // Save user
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Send welcome email
        try {
            await sendEmail(email, 'welcome', [username, email]);
            console.log(`✅ Welcome email sent to ${email}`);
        } catch (emailError) {
            console.error('⚠️ Failed to send welcome email:', emailError);
            // Don't fail registration if email fails
        }

        res.status(201).json({
            message: "Registration successful!",
            token,
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.name
            }
        });
    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            message: "Registration failed. Please try again.",
            error: error.message
        });
    }
});
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

            // Send login notification email
            try {
                const loginTime = new Date().toLocaleString();
                const deviceInfo = req.headers['user-agent'] || 'Unknown device';

                await sendEmail(email, 'loginNotification', [user.name, loginTime, deviceInfo]);
                console.log(`✅ Login notification sent to ${email}`);
            } catch (emailError) {
                console.error('⚠️ Failed to send login notification:', emailError);
                // Don't fail login if email fails
            }

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
router.post(
    "/update-gender",
    auth,  // This ensures the user is authenticated
    async (req, res) => {
        try {
            const { gender } = req.body;

            if (!['male', 'female', 'prefer_not_to_say'].includes(gender)) {
                return res.status(400).json({ message: "Invalid gender value" });
            }

            const user = await User.findByIdAndUpdate(
                req.user.id,
                { gender },
                { new: true }
            ).select("-password");

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json({
                success: true,
                message: "Gender updated successfully",
                gender: user.gender
            });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
);

export default router;