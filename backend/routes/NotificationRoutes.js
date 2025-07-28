import express from 'express';
import { auth } from './userRoutes.js';
import mongoose from 'mongoose';

const router = express.Router();
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['assessment_reminder', 'music_update', 'vital_signs_alert', 'app_update', 'wellness_tip', 'chat_suggestion'],
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
    }
}, {
    timestamps: true
});

// Index pour auto-suppression après expiration
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

// Fonction pour créer des notifications automatiques
export const createNotification = async (userId, title, message, type, priority = 'medium', data = {}) => {
    try {
        const notification = new Notification({
            userId,
            title,
            message,
            type,
            priority,
            data
        });

        await notification.save();
        console.log(`✅ Notification created for user ${userId}: ${title}`);
        return notification;
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        return null;
    }
};

// Récupérer toutes les notifications d'un utilisateur
router.get('/', auth, async (req, res) => {
    try {
        const { limit = 20, unreadOnly = false } = req.query;

        let query = { userId: req.user.id };
        if (unreadOnly === 'true') {
            query.read = false;
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const unreadCount = await Notification.countDocuments({
            userId: req.user.id,
            read: false
        });

        res.json({
            success: true,
            notifications,
            unreadCount,
            total: notifications.length
        });

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Marquer une notification comme lue
router.post('/:id/read', auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Marquer toutes les notifications comme lues
router.post('/mark-all-read', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user.id, read: false },
            { read: true }
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Supprimer une notification
router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        res.json({
            success: true,
            message: 'Notification deleted'
        });

    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Obtenir le nombre de notifications non lues
router.get('/count', auth, async (req, res) => {
    try {
        const unreadCount = await Notification.countDocuments({
            userId: req.user.id,
            read: false
        });

        res.json({
            success: true,
            unreadCount
        });

    } catch (error) {
        console.error('Error getting notification count:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
export { Notification };