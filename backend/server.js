import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { cleanEnv, str, port } from "envalid";
import chatbotRoutes from './routes/ChatbotRoutes.js';
import userRoutes from "./routes/userRoutes.js";
import medicationRoutes from './routes/MedicationRoutes.js';
import assessmentRoutes from './routes/AssessmentRoutes.js';
import musicRoutes from './routes/MusicRoutes.js';
// Initialize app and config
const app = express();
dotenv.config();

// Environment validation
const env = cleanEnv(process.env, {
  MONGO_URI: str({ desc: 'MongoDB connection string' }),
  PORT: port({ default: 5000, desc: 'Server port' })
  // Include any other environment variables you're using
});

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
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  res.status(200).json({
    message: 'File uploaded successfully',
    file: req.file.filename
  });
});

// Register routes
app.use("/api/auth", userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/music', musicRoutes);
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