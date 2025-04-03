import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true, // Normalize email to lowercase
            trim: true, // Remove whitespace
        },
        password: { type: String, required: false }, // Optional for social login users
        googleId: { type: String, unique: true, sparse: true }, // For Google OAuth
        facebookId: { type: String, unique: true, sparse: true }, // For Facebook OAuth
        authProvider: { type: String, enum: ['local', 'google', 'facebook'], default: 'local' }, // Track login method
    },
    { timestamps: true }
);

export default mongoose.model("User", UserSchema);