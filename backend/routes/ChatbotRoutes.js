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

// IMPORTANT: Define the model consistently - you were using 'chatbot' in some places and 'Conversation' in others
const Conversation = mongoose.models.Conversation ||
    mongoose.model('Conversation', conversationSchema);

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

// Fix all other routes that use Conversation model
router.post('/assessment-results', auth, async (req, res) => {
    try {
        const {
            conversationId,
            responses,
            analysis,
            recommendations,
            stressLevel,
            mood
        } = req.body;

        // Find the conversation
        let conversation;

        if (conversationId) {
            // If conversation ID provided, use it
            conversation = await Conversation.findOne({  // Fixed: using Conversation model
                _id: conversationId,
                userId: req.user.id
            });
        } else {
            // Otherwise find most recent conversation
            conversation = await Conversation.findOne({  // Fixed: using Conversation model
                userId: req.user.id
            }).sort({ lastUpdated: -1 });
        }

        if (!conversation) {
            return res.status(404).json({
                success: false,
                message: "No conversation found to save assessment results"
            });
        }

        // Update with assessment results
        conversation.assessmentResults = {
            responses,
            analysis,
            recommendations,
            stressLevel,
            mood,
            completed: true,
            completedAt: new Date()
        };

        // Update topic to reflect this is an assessment
        if (conversation.topic !== "Mental Health Assessment") {
            conversation.topic = "Mental Health Assessment";
        }

        // Save updated conversation
        await conversation.save();

        res.status(200).json({
            success: true,
            message: "Assessment results saved to conversation",
            conversationId: conversation._id
        });
    } catch (error) {
        console.error("Error saving assessment results:", error);
        res.status(500).json({
            success: false,
            message: "Error saving assessment results",
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

export default router;