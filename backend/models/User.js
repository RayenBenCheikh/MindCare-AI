import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    profileImage: {
        name: { type: String },
        data: { type: Buffer },
        contentType: { type: String }
    }
});

const User = mongoose.model("User", userSchema);

export default User;
