import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthContext } from '@/src/context/AuthContext';
import { api } from '@/src/api/config';

interface AIChatbotProps {
    onChatPress: () => void;
    onSettingsPress: () => void;
}

interface ChatbotStats {
    totalConversations: number;
    thisMonthConversations: number;
    remainingThisMonth: number;
    monthlyLimit: number;
}

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const AIChatbot = ({ }: AIChatbotProps) => {
    const navigation = useNavigation<NavigationProp>();
    const { userToken, userData } = useContext(AuthContext);
    const [stats, setStats] = useState<ChatbotStats>({
        totalConversations: 0,
        thisMonthConversations: 0,
        remainingThisMonth: 0,
        monthlyLimit: 100 // Default limit, you can make this configurable
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChatbotStats();
    }, []);

    const fetchChatbotStats = async () => {
        try {
            setLoading(true);

            // Fetch conversation history
            const response = await api.get('/api/chatbot/history', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success && response.data.conversations) {
                const conversations = response.data.conversations;
                const currentDate = new Date();
                const currentMonth = currentDate.getMonth();
                const currentYear = currentDate.getFullYear();

                // Count total conversations
                const totalConversations = conversations.length;

                // Count conversations from this month
                const thisMonthConversations = conversations.filter((conv: any) => {
                    const convDate = new Date(conv.createdAt || conv.lastUpdated);
                    return convDate.getMonth() === currentMonth && convDate.getFullYear() === currentYear;
                }).length;

                // Calculate remaining conversations for this month
                const monthlyLimit = 100; // You can make this configurable or fetch from user settings
                const remainingThisMonth = Math.max(0, monthlyLimit - thisMonthConversations);

                setStats({
                    totalConversations,
                    thisMonthConversations,
                    remainingThisMonth,
                    monthlyLimit
                });
            }
        } catch (error) {
            console.error('Error fetching chatbot stats:', error);
            // Keep default values on error
        } finally {
            setLoading(false);
        }
    };

    const handleSettingsPress = () => {
        navigation.navigate('settings');
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'k';
        }
        return num.toString();
    };

    return (
        <>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>AI Therapy Chatbot</Text>
                <TouchableOpacity onPress={handleSettingsPress}>
                    <Ionicons name="settings-outline" size={24} color="#5D4037" />
                </TouchableOpacity>
            </View>

            <View style={styles.chatbotCard}>
                <View style={styles.chatbotContent}>
                    <View>
                        <Text style={styles.chatbotNumber}>
                            {loading ? '...' : formatNumber(stats.totalConversations)}
                        </Text>
                        <Text style={styles.chatbotLabel}>Conversations</Text>
                    </View>
                    <View style={styles.chatbotImageContainer}>
                        <MaterialCommunityIcons name="robot" size={60} color="#CCCCCC" />
                        <View style={styles.chatbotBubble}>
                            <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
                        </View>
                    </View>
                </View>
                <View style={styles.chatbotActions}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#8DAA6D' }]}
                        onPress={() => {
                            navigation.navigate('Chatbot' as never);
                            // Refresh stats after navigating to chatbot
                            setTimeout(() => fetchChatbotStats(), 1000);
                        }}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#E18942' }]}
                        onPress={() => navigation.navigate('conversation')}
                    >
                        <Ionicons name="chatbubbles-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </>
    );
};

const styles = StyleSheet.create({
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    chatbotCard: {
        marginHorizontal: 20,
        borderRadius: 15,
        backgroundColor: '#808080',
        overflow: 'hidden',
        marginBottom: 20,
    },
    chatbotContent: {
        flexDirection: 'row',
        padding: 15,
        justifyContent: 'space-between',
    },
    chatbotNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        minWidth: 80, // Prevent layout shift while loading
    },
    chatbotLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    chatbotSubtext: {
        fontSize: 13,
        color: '#E8E8E8',
        marginBottom: 8,
        minHeight: 18, // Prevent layout shift while loading
    },
    chatbotPromo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    promoText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginLeft: 4,
    },
    chatbotImageContainer: {
        position: 'relative',
    },
    chatbotBubble: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#8DAA6D',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatbotActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
});

export default AIChatbot;