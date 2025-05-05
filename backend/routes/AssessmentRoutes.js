import express from "express";
import { auth } from "./userRoutes.js";
import Assessment from "../models/Assessment.js";

const router = express.Router();

// Submit a new assessment
router.post('/', async (req, res) => {
    try {
        console.log('Received assessment data:', req.body);

        // Create assessment data object without user field first
        const assessmentData = {
            healthGoal: req.body.healthGoal,
            gender: req.body.gender,
            age: req.body.age,
            weight: req.body.weight,
            height: req.body.height,
            mood: req.body.mood,
            sleepQuality: req.body.sleepQuality,
            professionalHelp: req.body.professionalHelp,
            medication: req.body.medication,
            prescribedMedications: req.body.prescribedMedications,
            completedAt: req.body.completedAt || new Date().toISOString(),
            isSubmitted: true
        };

        // Add user ID if available from auth token
        if (req.user && req.user.id) {
            assessmentData.user = req.user.id;
        }
        // Otherwise leave it undefined (don't set to "guest")

        // Create and save assessment
        const assessment = new Assessment(assessmentData);

        // Add debug logging
        console.log('About to save assessment...');
        const savedAssessment = await assessment.save();
        console.log('Assessment saved with ID:', savedAssessment._id);

        // Return success response
        res.status(201).json({
            success: true,
            message: 'Assessment saved successfully',
            assessmentId: savedAssessment._id
        });
    } catch (error) {
        console.error('Error saving assessment:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save assessment',
            error: error.message
        });
    }
});
router.post("/submit", auth, async (req, res) => {
    try {
        const {
            healthGoal,
            gender,
            age,
            weight,
            height,
            mood,
            sleepQuality,
            professionalHelp,
            completedAt
        } = req.body;

        // Check if user already has a submitted assessment
        const existingAssessment = await Assessment.findOne({
            user: req.user.id,
            isSubmitted: true
        });

        // Create new assessment or update existing
        let assessment;
        if (existingAssessment) {
            assessment = await Assessment.findByIdAndUpdate(
                existingAssessment._id,
                {
                    healthGoal,
                    gender,
                    age,
                    weight,
                    height,
                    mood,
                    sleepQuality,
                    professionalHelp,
                    completedAt,
                    isSubmitted: true
                },
                { new: true }
            );
        } else {
            assessment = new Assessment({
                user: req.user.id,
                healthGoal,
                gender,
                age,
                weight,
                height,
                mood,
                sleepQuality,
                professionalHelp,
                completedAt,
                isSubmitted: true
            });
            await assessment.save();
        }

        res.status(201).json({
            success: true,
            message: "Assessment submitted successfully",
            assessment
        });
    } catch (error) {
        console.error("Assessment submission error:", error);
        res.status(500).json({
            success: false,
            message: "Error submitting assessment",
            error: error.message
        });
    }
});

// Get user's latest assessment
router.get("/latest", auth, async (req, res) => {
    try {
        const assessment = await Assessment.findOne({
            user: req.user.id,
            isSubmitted: true
        }).sort({ createdAt: -1 });

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "No assessment found for this user"
            });
        }

        res.json({
            success: true,
            assessment
        });
    } catch (error) {
        console.error("Error fetching assessment:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching assessment",
            error: error.message
        });
    }
});

// Save assessment progress (draft)
router.post("/save-progress", auth, async (req, res) => {
    try {
        const {
            healthGoal,
            gender,
            age,
            weight,
            height,
            mood,
            sleepQuality,
            professionalHelp
        } = req.body;

        console.log('Received assessment data:', req.body);
        console.log('User ID from token:', req.user.id);

        // Look for existing draft assessment
        let assessment = await Assessment.findOne({
            user: req.user.id,
            isSubmitted: false
        });

        if (assessment) {
            // Update existing draft
            assessment = await Assessment.findByIdAndUpdate(
                assessment._id,
                {
                    healthGoal,
                    gender,
                    age,
                    weight,
                    height,
                    mood,
                    sleepQuality,
                    professionalHelp,
                    updatedAt: new Date()
                },
                { new: true }
            );

            console.log('Updated existing assessment:', assessment._id);
        } else {
            // Create new draft assessment
            assessment = new Assessment({
                user: req.user.id,
                healthGoal,
                gender,
                age,
                weight,
                height,
                mood,
                sleepQuality,
                professionalHelp
            });

            await assessment.save();
            console.log('Created new assessment:', assessment._id);
        }

        res.status(200).json({
            success: true,
            message: "Assessment progress saved",
            assessment
        });
    } catch (error) {
        console.error("Error saving assessment progress:", error);
        res.status(500).json({
            success: false,
            message: "Error saving assessment progress",
            error: error.message
        });
    }
});
// Get all user assessments (history)
router.get("/history", auth, async (req, res) => {
    try {
        const assessments = await Assessment.find({
            user: req.user.id,
            isSubmitted: true
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            count: assessments.length,
            assessments
        });
    } catch (error) {
        console.error("Error fetching assessment history:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching assessment history",
            error: error.message
        });
    }
});

// Delete an assessment
router.delete("/:id", auth, async (req, res) => {
    try {
        const assessment = await Assessment.findById(req.params.id);

        if (!assessment) {
            return res.status(404).json({
                success: false,
                message: "Assessment not found"
            });
        }

        // Check if user owns this assessment
        if (assessment.user.toString() !== req.user.id) {
            return res.status(401).json({
                success: false,
                message: "Not authorized to delete this assessment"
            });
        }

        await Assessment.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: "Assessment deleted successfully"
        });
    } catch (error) {
        console.error("Error deleting assessment:", error);
        res.status(500).json({
            success: false,
            message: "Error deleting assessment",
            error: error.message
        });
    }
});

export default router;