import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import User from "./models/User.js";  // Ensure correct path to User model
import userRoutes from "./routes/userRoutes.js";
import { cleanEnv, str, port } from "envalid";

dotenv.config();

// Environment validation - FIXED to include MONGO_URI
const env = cleanEnv(process.env, {
  MONGO_URI: str({ desc: 'MongoDB connection string' }),
  PORT: port({ default: 5000, desc: 'Server port' })
  // Include any other environment variables you're using
});

const app = express();

// CORS and middleware
app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer configuration for file upload
const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
    }
  }
});

// Health check endpoint for Express server
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Image upload route
app.post('/api/upload-profile-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided.'
      });
    }

    // Assuming you want to associate the image with a user
    const userId = req.body.userId; // You'll need to send userId from the client

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Update user with profile image
    user.profileImage = {
      name: `${uuidv4()}.${req.file.mimetype.split('/')[1]}`,
      data: req.file.buffer,
      contentType: req.file.mimetype
    };

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'Profile image uploaded successfully.',
      imageName: user.profileImage.name
    });
  } catch (error) {
    console.error('Image upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

// Existing routes
app.use("/api/auth", userRoutes);

// MongoDB connection and server start
mongoose
  .connect(env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
  })
  .then(() => {
    console.log("✅ MongoDB connecté avec succès");
    app.listen(env.PORT, () => console.log(`✅ Backend running on port ${env.PORT}`));
  })
  .catch((error) => console.error("❌ MongoDB Error:", error.message));

export default app;