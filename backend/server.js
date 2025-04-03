import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/userRoutes.js";
import { cleanEnv, str, port } from "envalid";

dotenv.config();

// 🔹 Validate environment variables
const env = cleanEnv(process.env, {
  PORT: port({ default: 5000 }),
  MONGO_URI: str({ default: "mongodb://127.0.0.1:27017/mindcare" }),
  JWT_SECRET: str(),
  GOOGLE_CLIENT_ID: str(),
  GOOGLE_CLIENT_SECRET: str(),
  FACEBOOK_CLIENT_ID: str(),
  FACEBOOK_CLIENT_SECRET: str(),
});

const app = express();

// 🔹 CORS Configuration for React Native
app.use(cors({
  origin: ['http://localhost:19006', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", userRoutes);

// ✅ Connexion MongoDB améliorée avec options
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

// Handle MongoDB connection errors after initial connection
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Route de test
app.get("/", async (req, res) => {
  try {
    res.json({ message: "MindCare AI Backend is running 🚀" });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});