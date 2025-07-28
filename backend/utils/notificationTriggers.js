import cron from 'node-cron';
// Fonction pour créer des notifications automatiques
export const createNotification = async (userId, title, message, type, priority = 'medium', data = {}) => {
    try {
        // Si vous n'avez pas encore de modèle Notification, on simule juste un log
        console.log(`📧 Notification créée pour ${userId}:`, {
            title,
            message,
            type,
            priority,
            data
        });

        // TODO: Implémenter la sauvegarde en base de données quand le modèle sera prêt
        return { id: Date.now(), title, message, type, priority, data };
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        return null;
    }
};

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

// Notifications programmées (version simplifiée)
export const setupScheduledNotifications = () => {
    console.log('📅 Configuration des notifications programmées...');

    // Rappel quotidien d'évaluation (9h00)
    cron.schedule('0 9 * * *', async () => {
        console.log('📅 Sending daily assessment reminders...');

        // TODO: Récupérer les utilisateurs de la base de données
        // Pour l'instant, on simule juste un log
        console.log('📋 Rappels d\'évaluation envoyés');
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
        console.log(`💡 Conseil du jour: ${randomTip}`);
    });

    console.log('✅ Notifications programmées configurées');
};