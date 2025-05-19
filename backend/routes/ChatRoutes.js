const express = require('express');
const router = express.Router();

// Depression and positive indicators from your Python model
const DEPRESSION_INDICATORS = [
    "bad", "sad", "depressed", "unhappy", "anxious", "worried", "tired", "exhausted",
    "lonely", "isolated", "hopeless", "worthless", "guilty", "crying",
    "no interest", "no energy", "no appetite", "can't sleep", "too much sleep",
    "difficulty", "struggle", "negative", "not good", "terrible", "1", "2", "no", "not"
];

const POSITIVE_INDICATORS = [
    "happy", "good", "great", "excellent", "fine", "joy", "content", "satisfied",
    "energetic", "motivated", "interested", "engaged", "hopeful", "optimistic",
    "peaceful", "relaxed", "grateful", "thankful", "loved", "supported", "4", "5", "yes"
];

const DEPRESSION_SOLUTIONS = [
    "Consider talking to a mental health professional for support and guidance.",
    "Try to establish a regular sleep schedule to improve your mood.",
    "Physical activity, even just a short walk, can help boost your mood.",
    "Practice mindfulness or meditation to help manage negative thoughts.",
    "Reach out to a friend or family member - social connection is important.",
    "Set small, achievable goals each day to build a sense of accomplishment.",
    "Limit alcohol and caffeine, as they can affect your mood and sleep.",
    "Try to get some sunlight each day, as it can improve your mood.",
    "Consider keeping a gratitude journal to focus on positive aspects of life.",
    "Remember that depression is treatable, and seeking help is a sign of strength."
];

// Preprocess text (similar to your Python implementation)
function preprocessText(text) {
    return text.toLowerCase().replace(/[^\w\s]/g, ' ');
}

// Analyze response for depression indicators
function analyzeResponse(response) {
    const processed = preprocessText(response);

    // Count depression indicators
    const depressionScore = DEPRESSION_INDICATORS.reduce((count, word) => {
        return processed.includes(word) ? count + 1 : count;
    }, 0);

    // Count positive indicators
    const positiveScore = POSITIVE_INDICATORS.reduce((count, word) => {
        return processed.includes(word) ? count + 1 : count;
    }, 0);

    return { depressionScore, positiveScore };
}

// Determine mood based on all responses
function determineMood(responses) {
    let totalDepressionScore = 0;
    let totalPositiveScore = 0;

    responses.forEach(response => {
        const { depressionScore, positiveScore } = analyzeResponse(response);
        totalDepressionScore += depressionScore;
        totalPositiveScore += positiveScore;
    });

    // Classification with score ratio
    if (totalDepressionScore > totalPositiveScore) {
        const severity = Math.min(10, Math.max(1,
            Math.floor((totalDepressionScore / (totalPositiveScore + 1)) * 5)
        ));
        return { mood: "depression", severity };
    } else {
        return { mood: "good", severity: 0 };
    }
}

// Get personalized solutions
function getPersonalizedSolutions(severity) {
    let solutionsText = "";
    let selectedSolutions = [];

    if (severity >= 7) {
        // Choose 5 random solutions
        selectedSolutions = DEPRESSION_SOLUTIONS.sort(() => 0.5 - Math.random()).slice(0, 5);
        solutionsText = "It seems you might be experiencing significant distress. Please consider seeking professional help as soon as possible.\n\n";
    } else {
        // Choose 3 random solutions
        selectedSolutions = DEPRESSION_SOLUTIONS.sort(() => 0.5 - Math.random()).slice(0, 3);
        solutionsText = "Here are some suggestions that might help improve your mood:\n\n";
    }

    selectedSolutions.forEach((solution, index) => {
        solutionsText += `${index + 1}. ${solution}\n`;
    });

    return solutionsText;
}

// API endpoint for assessment
router.post('/', (req, res) => {
    try {
        const { responses } = req.body;

        if (!responses || !Array.isArray(responses) || responses.length < 10) {
            return res.status(400).json({
                error: 'Invalid or incomplete assessment responses'
            });
        }

        const { mood, severity } = determineMood(responses);

        let message, solutions;

        if (mood === "depression") {
            message = "Based on your responses, you might be experiencing some signs of depression.";
            solutions = getPersonalizedSolutions(severity);
        } else {
            message = "Based on your responses, you seem to be in a generally positive emotional state.";
            solutions = "Keep up the good work maintaining your mental health! Remember to continue practices that support your wellbeing, like regular exercise, good sleep habits, social connection, and engaging in activities you enjoy.";
        }

        res.json({
            mood,
            severity,
            message,
            solutions
        });

    } catch (error) {
        console.error('Assessment error:', error);
        res.status(500).json({ error: 'Server error processing assessment' });
    }
});

module.exports = router;