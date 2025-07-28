import express from 'express';
import mongoose from 'mongoose';
import { auth } from './userRoutes.js';

const router = express.Router();

// Fix schema name typo and use consistent model name
const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        default: "New conversation"
    },
    messages: [{
        text: String,
        sender: {
            type: String,
            enum: ['user', 'bot']
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    assessmentResults: {
        responses: [String],
        analysis: String,
        recommendations: String,
        stressLevel: Number,
        mood: String,
        completed: {
            type: Boolean,
            default: false
        },
        completedAt: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});



// Define generateConversationTopic function before it's used
const generateConversationTopic = async (messages) => {
    if (!messages || messages.length === 0) {
        return "New conversation";
    }

    try {
        // Take up to first 3 messages to determine the topic
        const initialMessages = messages.slice(0, 3)
            .map(m => m.text)
            .join(" ");

        // Extract main topic - you can use your AI model here
        // For now, just use a simple rule
        if (initialMessages.toLowerCase().includes("assessment")) {
            return "Mental Health Assessment";
        } else if (initialMessages.toLowerCase().includes("stress")) {
            return "Stress Management";
        } else if (initialMessages.toLowerCase().includes("depress")) {
            return "Depression Support";
        } else if (initialMessages.toLowerCase().includes("anxiety")) {
            return "Anxiety Support";
        } else if (initialMessages.length > 20) {
            // Get first 20 chars as summary
            return initialMessages.substring(0, 20) + "...";
        } else {
            return "General Conversation";
        }
    } catch (error) {
        console.error("Error generating topic:", error);
        return "Conversation";
    }
};

// Add message to conversation
router.post('/messages', auth, async (req, res) => {
    try {
        const { text, sender, timestamp, conversationId } = req.body;

        // Find the active conversation or create a new one
        let conversation;

        if (conversationId) {
            // Try to find the specified conversation
            conversation = await Conversation.findOne({
                _id: conversationId,
                userId: req.user.id
            });

            if (!conversation) {
                return res.status(404).json({
                    success: false,
                    message: "Conversation not found"
                });
            }
        } else {
            // No conversation ID provided, find or create one
            conversation = await Conversation.findOne({
                userId: req.user.id
            }).sort({ lastUpdated: -1 });

            // If no conversation exists or last message is more than 1 hour old, create new one
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (!conversation || conversation.lastUpdated < oneHourAgo) {
                conversation = new Conversation({
                    userId: req.user.id,
                    messages: []
                });
            }
        }

        if (conversation.messages.length <= 1) {
            const messages = [...conversation.messages, { text, sender }];
            conversation.topic = await generateConversationTopic(messages);
        }

        // Add message to conversation
        conversation.messages.push({
            text,
            sender,
            timestamp: timestamp || new Date()
        });

        // Update lastUpdated time
        conversation.lastUpdated = new Date();

        // Save to database
        await conversation.save();

        res.status(201).json({
            success: true,
            message: "Message added to conversation"
        });
    } catch (error) {
        console.error("Error saving chat message:", error);
        res.status(500).json({
            success: false,
            message: "Error saving chat message",
            error: error.message
        });
    }
});

router.get('/assessment-results', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Find all conversations with completed assessment results for the user
        const conversations = await Conversation.find({
            userId: userId,
            'assessmentResults.completed': true
        }).sort({ 'assessmentResults.completedAt': -1 }).limit(50);

        // Extract assessment results from conversations
        const assessments = conversations
            .filter(conv => conv.assessmentResults && conv.assessmentResults.completed)
            .map(conv => ({
                _id: conv._id,
                stressLevel: conv.assessmentResults.stressLevel || 0,
                mood: conv.assessmentResults.mood || 'neutral',
                severity: conv.assessmentResults.stressLevel || 0,
                responses: conv.assessmentResults.responses || [],
                completedAt: conv.assessmentResults.completedAt || conv.createdAt,
                recommendations: conv.assessmentResults.recommendations || '',
                analysis: conv.assessmentResults.analysis || ''
            }));

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

// POST endpoint for saving assessment results
router.post('/assessment-results', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { 
            responses, 
            analysis, 
            recommendations, 
            stressLevel, 
            mood, 
            conversationId 
        } = req.body;

        // Find the conversation or create a new one
        let conversation;
        if (conversationId) {
            conversation = await Conversation.findOne({
                _id: conversationId,
                userId: userId
            });
        }

        if (!conversation) {
            // Create new conversation for this assessment
            conversation = new Conversation({
                userId: userId,
                topic: "Mental Health Assessment",
                messages: [],
                assessmentResults: {
                    responses: responses || [],
                    analysis: analysis || '',
                    recommendations: recommendations || '',
                    stressLevel: stressLevel || 0,
                    mood: mood || 'neutral',
                    completed: true,
                    completedAt: new Date()
                }
            });
        } else {
            // Update existing conversation with assessment results
            conversation.assessmentResults = {
                responses: responses || [],
                analysis: analysis || '',
                recommendations: recommendations || '',
                stressLevel: stressLevel || 0,
                mood: mood || 'neutral',
                completed: true,
                completedAt: new Date()
            };
            conversation.lastUpdated = new Date();
        }

        await conversation.save();

        res.json({
            success: true,
            message: 'Assessment results saved successfully',
            conversationId: conversation._id,
            assessmentResults: conversation.assessmentResults
        });

    } catch (error) {
        console.error('Error saving assessment results:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving assessment results',
            error: error.message
        });
    }
});

// Add stats endpoint for AIChatbot component
router.get('/stats', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Get current date info
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

        // Count total conversations for user
        const totalConversations = await Conversation.countDocuments({
            userId: userId
        });

        // Count conversations from this month
        const thisMonthConversations = await Conversation.countDocuments({
            userId: userId,
            createdAt: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        // You can make this configurable per user or subscription tier
        const monthlyLimit = 100;
        const remainingThisMonth = Math.max(0, monthlyLimit - thisMonthConversations);

        // Count assessments completed this month
        const assessmentsThisMonth = await Conversation.countDocuments({
            userId: userId,
            'assessmentResults.completed': true,
            'assessmentResults.completedAt': {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        res.json({
            success: true,
            stats: {
                totalConversations,
                thisMonthConversations,
                remainingThisMonth,
                monthlyLimit,
                assessmentsThisMonth
            }
        });

    } catch (error) {
        console.error('Error fetching chatbot stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching chatbot statistics',
            error: error.message
        });
    }
});
// Get conversation history for a user
router.get('/history', auth, async (req, res) => {
    try {
        // Get all conversations for this user, newest first
        const conversations = await Conversation.find({  // Fixed: using Conversation model
            userId: req.user.id
        }).sort({ lastUpdated: -1 });

        // Enhance conversations with better preview text
        const enhancedConversations = conversations.map(conversation => {
            // Filter out messages with actual content
            const significantMessages = conversation.messages.filter(
                msg => msg.text && msg.text.trim().length > 0
            );

            // Get the most recent bot message for preview if available
            const lastBotMessage = [...significantMessages]
                .reverse()
                .find(msg => msg.sender === 'bot');

            // Create a better preview from the last bot message if available
            const preview = lastBotMessage ?
                lastBotMessage.text :
                conversation.topic;

            return {
                ...conversation.toObject(),
                preview
            };
        });

        res.status(200).json({
            success: true,
            conversations: enhancedConversations
        });
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching conversations",
            error: error.message
        });
    }
});

// Get a single conversation by ID
router.get('/:conversationId', auth, async (req, res) => {
    try {
        const conversation = await Conversation.findOne({  // Fixed: using Conversation model
            _id: req.params.conversationId,
            userId: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "Conversation not found"
            });
        }

        res.status(200).json({
            success: true,
            conversation
        });
    } catch (error) {
        console.error("Error fetching conversation:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching conversation",
            error: error.message
        });
    }
});
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema, 'conversations');
export default router;