import mongoose from "mongoose";

const AssessmentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false // Make optional for non-authenticated users
        },
        healthGoal: {
            id: String,
            text: String
        },
        gender: String,
        age: Number,
        weight: {
            value: Number,
            unit: String,
            valueInKg: Number
        },
        height: {
            value: Number,
            unit: String,
            valueInCm: Number
        },
        mood: {
            id: String,
            label: String
        },
        sleepQuality: {
            label: String,
            hours: String
        },
        professionalHelp: String,
        medication: String,
        prescribedMedications: [
            {
                id: String,
                name: String
            }
        ],
        completedAt: Date,
        isSubmitted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model("Assessment", AssessmentSchema);