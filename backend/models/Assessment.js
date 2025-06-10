// In your Assessment.js model file
import mongoose from 'mongoose';

const assessmentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    description: String,
    healthGoal: {
        id: String,
        text: String
    },
    gender: String,
    age: Number,
    weight: {
        value: Number,
        unit: String
    },
    height: {
        value: Number,
        unit: String
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
    prescribedMedications: String,
    completedAt: Date,
    isSubmitted: {
        type: Boolean,
        default: false
    },
    vitalSigns: [{
        timestamp: Number,
        date: String,
        heartRate: Number,
        systolicBP: Number,
        diastolicBP: Number,
        confidence: Number
    }],
    mentalHealthAssessment: mongoose.Schema.Types.Mixed
}, {
    timestamps: true
});

export default mongoose.model('Assessment', assessmentSchema);