import express from "express";
import { auth } from "./userRoutes.js";
import Assessment from "../models/Assessment.js";

const router = express.Router();

// Submit a new assessment
router.post('/', auth, async (req, res) => {
    try {
        console.log('Received assessment data:', req.body);
        console.log('User ID from auth:', req.user.id);

        // Create assessment data object including user ID
        const assessmentData = {
            user: req.user.id, // Keep this for database relations
            // Remove the _id field assignment
            description: req.body.description || "Mental health assessment",
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
            isSubmitted: true,
            mentalHealthAssessment: req.body.mentalHealthAssessment
        };
        // Create and save assessment
        const assessment = new Assessment(assessmentData);

        // Add debug logging
        console.log('About to save assessment for user:', req.user.id);
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
            completedAt,
            description,
            mentalHealthResponses,
            mentalHealthStressLevel
        } = req.body;

        // Check if user already has a submitted assessment
        const existingAssessment = await Assessment.findOne({
            user: req.user.id,
            isSubmitted: true
        }).sort({ createdAt: -1 }); // Get the most recent one

        // Create new assessment or update existing
        let assessment;
        if (existingAssessment) {
            console.log('Updating existing assessment:', existingAssessment._id);

            // Update fields only if they are provided
            const updateData = {};
            if (description) updateData.description = description;
            if (healthGoal) updateData.healthGoal = healthGoal;
            if (gender) updateData.gender = gender;
            if (age) updateData.age = age;
            if (weight) updateData.weight = weight;
            if (height) updateData.height = height;
            if (mood) updateData.mood = mood;
            if (sleepQuality) updateData.sleepQuality = sleepQuality;
            if (professionalHelp) updateData.professionalHelp = professionalHelp;
            if (completedAt) updateData.completedAt = completedAt;
            updateData.isSubmitted = true;

            // Update the assessment
            assessment = await Assessment.findByIdAndUpdate(
                existingAssessment._id,
                updateData,
                { new: true }
            );
        } else {
            // Create new assessment
            assessment = new Assessment({
                user: req.user.id,
                description,
                healthGoal,
                gender,
                age,
                weight,
                height,
                mood,
                sleepQuality,
                professionalHelp,
                mentalHealthResponses,
                mentalHealthStressLevel,
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

router.get("/vitalSigns", auth, async (req, res) => {
    try {
        const { userId, assessmentId, timeRange = '30d' } = req.query;

        console.log('=== VITAL SIGNS REQUEST ===');
        console.log('Query params:', { userId, assessmentId, timeRange });
        console.log('User from auth middleware:', req.user?.id);

        // If assessmentId is provided, get vital signs from specific assessment
        if (assessmentId) {
            console.log('Fetching vital signs for assessment:', assessmentId);

            try {
                // Use Mongoose's findById directly - it handles ObjectId conversion
                const assessment = await Assessment.findById(assessmentId);

                console.log('Assessment found:', !!assessment);

                if (!assessment) {
                    console.log('No assessment found with ID:', assessmentId);
                    return res.json({
                        success: false,
                        message: 'Assessment not found',
                        vitalSigns: [],
                        count: 0
                    });
                }

                console.log('Assessment details:', {
                    id: assessment._id,
                    user: assessment.user,
                    hasVitalSigns: !!assessment.vitalSigns,
                    vitalSignsCount: assessment.vitalSigns?.length || 0,
                    isSubmitted: assessment.isSubmitted,
                    createdAt: assessment.createdAt,
                    completedAt: assessment.completedAt
                });

                // Log the actual vital signs data
                if (assessment.vitalSigns && assessment.vitalSigns.length > 0) {
                    console.log('Raw vital signs data:', assessment.vitalSigns);
                }

                // Extract vital signs from this assessment
                const vitalSigns = assessment.vitalSigns || [];

                // Format the data
                const formattedVitalSigns = vitalSigns.map((vitalSign, index) => {
                    const formatted = {
                        timestamp: vitalSign.timestamp,
                        date: vitalSign.date,
                        heartRate: vitalSign.heartRate,
                        systolicBP: vitalSign.systolicBP,
                        diastolicBP: vitalSign.diastolicBP,
                        confidence: vitalSign.confidence,
                        _id: `${assessmentId}_${vitalSign.timestamp || index}`,
                        assessmentId: assessmentId
                    };
                    console.log(`Formatted vital sign ${index}:`, formatted);
                    return formatted;
                });

                console.log('Final response:', {
                    success: true,
                    count: formattedVitalSigns.length,
                    vitalSigns: formattedVitalSigns
                });

                return res.json({
                    success: true,
                    vitalSigns: formattedVitalSigns,
                    count: formattedVitalSigns.length
                });

            } catch (dbError) {
                console.error('Database error:', dbError);
                return res.status(500).json({
                    success: false,
                    message: 'Database error',
                    error: dbError.message,
                    vitalSigns: [],
                    count: 0
                });
            }
        }

        // If no assessmentId, get all vital signs for user
        console.log('No assessmentId provided, fetching for user...');

        const targetUserId = userId || req.user.id;
        console.log('Target user ID:', targetUserId);

        const assessments = await Assessment.find({
            user: targetUserId,
            vitalSigns: { $exists: true, $ne: [] },
            isSubmitted: true
        }).sort({ completedAt: -1 });

        console.log('Found assessments for user:', assessments.length);

        const allVitalSigns = [];

        assessments.forEach((assessment, assessmentIndex) => {
            console.log(`Processing assessment ${assessmentIndex}:`, {
                id: assessment._id,
                vitalSignsCount: assessment.vitalSigns?.length || 0
            });

            if (assessment.vitalSigns && assessment.vitalSigns.length > 0) {
                assessment.vitalSigns.forEach((vitalSign, vitalIndex) => {
                    const formatted = {
                        timestamp: vitalSign.timestamp,
                        date: vitalSign.date,
                        heartRate: vitalSign.heartRate,
                        systolicBP: vitalSign.systolicBP,
                        diastolicBP: vitalSign.diastolicBP,
                        confidence: vitalSign.confidence,
                        assessmentId: assessment._id,
                        _id: `${assessment._id}_${vitalSign.timestamp || vitalIndex}`
                    };

                    console.log(`Adding vital sign ${vitalIndex} from assessment ${assessmentIndex}:`, formatted);
                    allVitalSigns.push(formatted);
                });
            }
        });

        console.log('Total vital signs found:', allVitalSigns.length);

        res.json({
            success: true,
            vitalSigns: allVitalSigns,
            count: allVitalSigns.length
        });

    } catch (error) {
        console.error('Error in /vitalSigns route:', error);
        res.status(500).json({
            success: false,
            message: "Error fetching vital signs",
            error: error.message,
            vitalSigns: [],
            count: 0
        });
    }
});
router.get('/assessment-results', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all assessment results for the user
        const assessments = await AssessmentResult.find({
            userId: userId
        }).sort({ completedAt: -1 }).limit(50); // Get last 50 assessments

        res.json({
            success: true,
            assessments: assessments,
            count: assessments.length
        });

    } catch (error) {
        console.error('Error fetching assessment results:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching assessment results',
            error: error.message
        });
    }
});
router.get("/debug/user-assessments", auth, async (req, res) => {
    try {
        const { userId } = req.query;
        const targetUserId = userId || req.user.id;

        console.log('Debug: Looking for assessments for user:', targetUserId);

        // Get all assessments for this user
        const allAssessments = await Assessment.find({ user: targetUserId });

        console.log('Debug: Found total assessments:', allAssessments.length);

        const assessmentInfo = allAssessments.map(assessment => ({
            id: assessment._id,
            createdAt: assessment.createdAt,
            completedAt: assessment.completedAt,
            isSubmitted: assessment.isSubmitted,
            hasVitalSigns: !!assessment.vitalSigns,
            vitalSignsCount: assessment.vitalSigns?.length || 0,
            vitalSigns: assessment.vitalSigns || []
        }));

        res.json({
            message: 'Debug info for user assessments',
            userId: targetUserId,
            totalAssessments: allAssessments.length,
            assessments: assessmentInfo
        });

    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
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