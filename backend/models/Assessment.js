import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    healthGoal: {
        id: { type: String },
        text: { type: String }
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'prefer_not_to_say'],
        default: 'prefer_not_to_say'
    },
    age: {
        type: Number,
        min: 0,
        max: 120
    },
    weight: {
        value: { type: Number },
        unit: {
            type: String,
            enum: ['kg', 'lbs'],
            default: 'kg'
        }
    },
    height: {
        value: { type: Number },
        unit: {
            type: String,
            enum: ['cm', 'ft'],
            default: 'cm'
        }
    },
    mood: {
        id: { type: String },
        label: { type: String }
    },
    sleepQuality: {
        label: { type: String },
        hours: { type: String }
    },
    professionalHelp: {
        type: String,
        enum: ['yes', 'no', null],
        default: null
    },
    completedAt: {
        type: Date
    },
    isSubmitted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Assessment = mongoose.model("Assessment", assessmentSchema);

export default Assessment;