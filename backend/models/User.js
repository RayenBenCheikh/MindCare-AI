import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
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
    gender: {
        type: String,
        enum: ['male', 'female', 'prefer_not_to_say'],
        default: 'prefer_not_to_say'
    },
    profileImage: {
        name: { type: String },
        data: { type: Buffer },
        contentType: { type: String }
    }
});

const User = mongoose.model("User", userSchema);

export default User;