import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import NotificationService, { Notification } from '@/src/service/NotificationService';

const NotificationsScreen = () => {
    const navigation = useNavigation();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Charger les notifications
    const loadNotifications = async () => {
        try {
            const notificationService = NotificationService.getInstance();
            const { notifications: fetchedNotifications } = await notificationService.getNotifications();
            setNotifications(fetchedNotifications);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Rafraîchir les notifications
    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    };

    // Marquer toutes comme lues
    const markAllAsRead = async () => {
        try {
            const notificationService = NotificationService.getInstance();
            await notificationService.markAllAsRead();

            // Mettre à jour l'état local
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, read: true }))
            );
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Marquer une notification comme lue
    const markAsRead = async (notificationId: string) => {
        try {
            const notificationService = NotificationService.getInstance();
            await notificationService.markAsRead(notificationId);

            // Mettre à jour l'état local
            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Obtenir l'icône selon le type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'app_update': return 'rocket';
            case 'music_update': return 'musical-notes';
            case 'vital_signs_alert': return 'heart';
            case 'assessment_reminder': return 'clipboard';
            case 'wellness_tip': return 'bulb';
            case 'chat_suggestion': return 'chatbubbles';
            default: return 'notifications';
        }
    };

    // Obtenir la couleur selon la priorité
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return '#E74C3C';
            case 'medium': return '#E18942';
            case 'low': return '#3498DB';
            default: return '#95A5A6';
        }
    };

    useEffect(() => {
        loadNotifications();
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text>Chargement des notifications...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Notifications</Text>
                <TouchableOpacity onPress={markAllAsRead}>
                    <Text style={styles.markAll}>Tout lire</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {notifications.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="notifications-off" size={64} color="#BDC3C7" />
                        <Text style={styles.emptyText}>Aucune notification</Text>
                        <Text style={styles.emptySubtext}>Vous êtes à jour !</Text>
                    </View>
                ) : (
                    notifications.map((notification) => (
                        <TouchableOpacity
                            key={notification._id}
                            style={[
                                styles.notificationItem,
                                !notification.read && styles.unreadItem
                            ]}
                            onPress={() => markAsRead(notification._id)}
                        >
                            <View style={styles.notificationHeader}>
                                <View style={styles.iconContainer}>
                                    <Ionicons
                                        name={getNotificationIcon(notification.type)}
                                        size={20}
                                        color={getPriorityColor(notification.priority)}
                                    />
                                </View>

                                <View style={styles.notificationContent}>
                                    <View style={styles.titleRow}>
                                        <Text style={[
                                            styles.notificationTitle,
                                            !notification.read && styles.unreadTitle
                                        ]}>
                                            {notification.title}
                                        </Text>
                                        <Text style={styles.notificationTime}>
                                            {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </Text>
                                    </View>

                                    <Text style={styles.notificationMessage}>
                                        {notification.message}
                                    </Text>
                                </View>

                                {!notification.read && <View style={styles.unreadDot} />}
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    markAll: {
        color: '#E18942',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#7F8C8D',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#BDC3C7',
        marginTop: 8,
    },
    notificationItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginVertical: 8,
        borderWidth: 1,
        borderColor: '#E9ECEF',
    },
    unreadItem: {
        backgroundColor: '#FFF9E6',
        borderColor: '#E18942',
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        position: 'relative',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F1F2F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationContent: {
        flex: 1,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        flex: 1,
        marginRight: 8,
    },
    unreadTitle: {
        color: '#E18942',
    },
    notificationTime: {
        fontSize: 12,
        color: '#666',
    },
    notificationMessage: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    unreadDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E18942',
    },
});

export default NotificationsScreen;