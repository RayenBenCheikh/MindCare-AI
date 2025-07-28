import { createNotification } from '../routes/NotificationRoutes.js';
import cron from 'node-cron';

// Fonction pour créer des notifications basées sur les événements
export const triggerNotifications = {
    // Nouvelle musique ajoutée
    newMusicAdded: async (userId, musicTitle, category) => {
        await createNotification(
            userId,
            '🎵 Nouvelle musique disponible',
            `Découvrez "${musicTitle}" dans la catégorie ${category}`,
            'music_update',
            'low',
            { musicTitle, category }
        );
    },

    // Rappel d'évaluation
    assessmentReminder: async (userId) => {
        await createNotification(
            userId,
            '📋 Temps pour votre évaluation',
            'Il est temps de faire votre évaluation quotidienne de bien-être mental',
            'assessment_reminder',
            'medium'
        );
    },

    // Alerte signes vitaux
    vitalSignsAlert: async (userId, heartRate, bloodPressure) => {
        await createNotification(
            userId,
            '⚠️ Alerte signes vitaux',
            `Vos dernières mesures montrent des valeurs élevées (${heartRate} BPM, ${bloodPressure})`,
            'vital_signs_alert',
            'high',
            { heartRate, bloodPressure }
        );
    },

    // Mise à jour de l'application
    appUpdate: async (userId, version, features) => {
        await createNotification(
            userId,
            '🚀 Mise à jour disponible',
            `Version ${version} disponible avec de nouvelles fonctionnalités !`,
            'app_update',
            'medium',
            { version, features }
        );
    },

    // Conseil bien-être
    wellnessTip: async (userId, tip) => {
        await createNotification(
            userId,
            '💡 Conseil bien-être',
            tip,
            'wellness_tip',
            'low'
        );
    },

    // Suggestion de chat basée sur l'humeur
    chatSuggestion: async (userId, mood) => {
        await createNotification(
            userId,
            '💬 Parlons de votre humeur',
            `Vous semblez ${mood}. Voulez-vous discuter avec notre IA ?`,
            'chat_suggestion',
            'medium',
            { mood }
        );
    }
};

// Notifications programmées (cron jobs)
export const setupScheduledNotifications = () => {
    // Rappel quotidien d'évaluation (9h00)
    cron.schedule('0 9 * * *', async () => {
        console.log('📅 Sending daily assessment reminders...');

        // Récupérer tous les utilisateurs actifs
        const User = mongoose.model('User');
        const users = await User.find({}).select('_id');

        for (const user of users) {
            // Vérifier si l'utilisateur a déjà fait son évaluation aujourd'hui
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const Assessment = mongoose.model('Assessment');
            const todayAssessment = await Assessment.findOne({
                user: user._id,
                createdAt: { $gte: today }
            });

            if (!todayAssessment) {
                await triggerNotifications.assessmentReminder(user._id);
            }
        }
    });

    // Conseils bien-être (3 fois par semaine à 14h00)
    cron.schedule('0 14 * * 1,3,5', async () => {
        console.log('💡 Sending wellness tips...');

        const tips = [
            "Prenez 5 minutes pour respirer profondément et vous détendre",
            "N'oubliez pas de boire de l'eau régulièrement",
            "Une courte promenade peut améliorer votre humeur",
            "Prenez le temps de noter 3 choses positives de votre journée",
            "Écoutez de la musique relaxante pour réduire le stress"
        ];

        const randomTip = tips[Math.floor(Math.random() * tips.length)];

        const User = mongoose.model('User');
        const users = await User.find({}).select('_id');

        for (const user of users) {
            await triggerNotifications.wellnessTip(user._id, randomTip);
        }
    });
};