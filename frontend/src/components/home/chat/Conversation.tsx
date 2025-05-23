import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { AuthContext } from '@/src/context/AuthContext';
import { api } from '@/src/api/config';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { colors } from '@/src/theme';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface Message {
    text?: string;
}

interface Conversation {
    _id: string;
    topic?: string;
    messages?: Message[];
    lastUpdated?: string;
    createdAt?: string;
    assessmentResults?: {
        responses?: string[];
        analysis?: string;
        recommendations?: string;
        stressLevel?: number;
        mood?: string;
        completed?: boolean;
        completedAt?: string;
    };
}
const Conversations = () => {
    const navigation = useNavigation<NavigationProp>();
    const { userToken, userData } = useContext(AuthContext);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await api.get('/api/chatbot/history');

            if (response.data.success && response.data.conversations) {
                setConversations(response.data.conversations);
            } else {
                setError('Failed to load conversations');
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
            setError('Could not connect to the server');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return 'No date';

        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Conversation History</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#8DAA6D" />
                        <Text style={styles.loadingText}>Loading conversations...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={48} color="#E18942" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={fetchConversations}
                        >
                            <Text style={styles.retryButtonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                ) : conversations.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubble-ellipses-outline" size={48} color="#8DAA6D" />
                        <Text style={styles.emptyText}>No conversations yet</Text>
                        <TouchableOpacity
                            style={styles.startChatButton}
                            onPress={() => navigation.navigate('home')}
                        >
                            <Text style={styles.startChatButtonText}>Start a Chat</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={conversations}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={styles.listContainer}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.conversationItem}
                                onPress={() => navigation.navigate('Chatbot', {
                                    conversationId: item._id
                                })}
                            >
                                <View style={styles.conversationHeader}>
                                    <Text style={styles.conversationTopic}>
                                        {item.topic || "Untitled Conversation"}
                                    </Text>
                                    {item.assessmentResults?.completed && (
                                        <View style={styles.assessmentBadge}>
                                            <Text style={styles.assessmentBadgeText}>
                                                Assessment
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {item.assessmentResults?.completed ? (
                                    // Show assessment summary if available
                                    <View style={styles.assessmentSummary}>
                                        <Text style={styles.assessmentLabel}>
                                            Stress Level: <Text style={styles.assessmentValue}>
                                                {item.assessmentResults.stressLevel}/5
                                            </Text>
                                        </Text>
                                        <Text style={styles.assessmentLabel}>
                                            Mood: <Text style={styles.assessmentValue}>
                                                {item.assessmentResults.mood}
                                            </Text>
                                        </Text>
                                        <Text style={styles.previewText} numberOfLines={2}>
                                            {item.assessmentResults.recommendations}
                                        </Text>
                                    </View>
                                ) : (
                                    // Show regular message preview
                                    <Text style={styles.previewText}>
                                        {item.messages && item.messages.length > 0
                                            ? (item.messages[item.messages.length - 1]?.text || "").substring(0, 60) + "..."
                                            : "No messages"}
                                    </Text>
                                )}

                                <Text style={styles.conversationDate}>
                                    {formatDate(item.lastUpdated || item.createdAt)}
                                </Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>

            {/* Tab bar space */}
            <View style={styles.tabBarSpace} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.marron,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.marron,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    headerRightPlaceholder: {
        width: 24,
    },
    content: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    listContainer: {
        padding: 16,
        paddingBottom: 100, // Extra padding at bottom
    },
    conversationItem: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 2,
    },
    conversationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    conversationTopic: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    messageCountBadge: {
        backgroundColor: '#8DAA6D',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
        minWidth: 24,
        alignItems: 'center',
    },
    messageCountText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    previewText: {
        color: '#666',
        fontSize: 14,
        marginBottom: 8,
    },
    conversationDate: {
        color: '#999',
        fontSize: 12,
        textAlign: 'right',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        marginTop: 12,
        marginBottom: 16,
        color: '#666',
        fontSize: 16,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#8DAA6D',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    assessmentBadge: {
        backgroundColor: '#E18942',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    assessmentBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    assessmentSummary: {
        marginVertical: 8,
    },
    assessmentLabel: {
        fontSize: 14,
        color: '#555',
        marginBottom: 4,
    },
    assessmentValue: {
        fontWeight: 'bold',
        color: '#333',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        marginTop: 12,
        marginBottom: 16,
        color: '#666',
        fontSize: 16,
    },
    startChatButton: {
        backgroundColor: '#8DAA6D',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    startChatButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    tabBarSpace: {
        height: 75, // Height for tab bar
    },
});

export default Conversations;