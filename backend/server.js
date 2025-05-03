import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import User from "./models/User.js";
import userRoutes from "./routes/userRoutes.js";
import assessmentRoutes from "./routes/AssessmentRoutes.js";
import { cleanEnv, str, port } from "envalid";

dotenv.config();
const medicationRoutes = require('./routes/MedicationRoutes');
// Environment validation
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
  // Keep existing code...
});

// Existing routes
app.use("/api/auth", userRoutes);

// Add assessment routes
app.use("/api/assessment", assessmentRoutes);
app.use('/api/medications', medicationRoutes);
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