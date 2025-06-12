import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    FlatList,
    Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '@/src/context/AuthContext';
import { api } from '@/src/api/config';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface SessionData {
    date: string;
    hours: number;
    sessions: number;
    type: string;
}

const MindfulHours = () => {
    const navigation = useNavigation<NavigationProp>();
    const { userToken } = useContext(AuthContext);
    const [sessions, setSessions] = useState<SessionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalHours, setTotalHours] = useState(0);
    const [weeklyGoal] = useState(8); // 8 hours per week goal

    useEffect(() => {
        fetchSessionData();
    }, []);

    const fetchSessionData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/chatbot/history', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const conversations = response.data.conversations || [];
                const processedSessions = processSessionData(conversations);
                setSessions(processedSessions);

                const total = processedSessions.reduce((sum, session) => sum + session.hours, 0);
                setTotalHours(total);
            }
        } catch (error) {
            console.error('Error fetching session data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processSessionData = (conversations: any[]): SessionData[] => {
        const sessionMap = new Map<string, SessionData>();

        conversations.forEach(conv => {
            const date = new Date(conv.createdAt || conv.lastUpdated).toDateString();
            const hours = 0.25; // 15 minutes per session

            if (sessionMap.has(date)) {
                const existing = sessionMap.get(date)!;
                existing.hours += hours;
                existing.sessions += 1;
            } else {
                sessionMap.set(date, {
                    date,
                    hours,
                    sessions: 1,
                    type: 'Chatbot Session'
                });
            }
        });

        return Array.from(sessionMap.values()).sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    };

    const getWeeklyProgress = () => {
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const weeklyHours = sessions
            .filter(session => new Date(session.date) >= oneWeekAgo)
            .reduce((sum, session) => sum + session.hours, 0);

        return Math.min((weeklyHours / weeklyGoal) * 100, 100);
    };

    const renderSessionItem = ({ item }: { item: SessionData }) => (
        <View style={styles.sessionItem}>
            <View style={styles.sessionHeader}>
                <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDate}>
                        {new Date(item.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </Text>
                    <Text style={styles.sessionType}>{item.type}</Text>
                </View>
                <View style={styles.sessionMetrics}>
                    <View style={styles.metricBadge}>
                        <Ionicons name="time" size={12} color="#8DAA6D" />
                        <Text style={styles.metricText}>{item.hours.toFixed(1)}h</Text>
                    </View>
                    <View style={styles.metricBadge}>
                        <Ionicons name="chatbubbles" size={12} color="#8DAA6D" />
                        <Text style={styles.metricText}>{item.sessions} sessions</Text>
                    </View>
                </View>
            </View>
            <View style={styles.progressBarSmall}>
                <View style={[
                    styles.progressFillSmall,
                    { width: `${Math.min((item.hours / 2) * 100, 100)}%` }
                ]} />
            </View>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#5D4037" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mindful Hours</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8DAA6D" />
                    <Text style={styles.loadingText}>Loading your sessions...</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#5D4037" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mindful Hours</Text>
                <TouchableOpacity onPress={fetchSessionData}>
                    <Ionicons name="refresh" size={24} color="#5D4037" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Progress Overview */}
                <View style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <MaterialCommunityIcons name="clock-outline" size={32} color="#8DAA6D" />
                        <View style={styles.progressText}>
                            <Text style={styles.progressTitle}>Weekly Progress</Text>
                            <Text style={styles.progressValue}>
                                {getWeeklyProgress().toFixed(0)}% of {weeklyGoal}h goal
                            </Text>
                        </View>
                    </View>
                    <View style={styles.progressBarLarge}>
                        <View style={[
                            styles.progressFillLarge,
                            { width: `${getWeeklyProgress()}%` }
                        ]} />
                    </View>
                    <Text style={styles.progressSubtext}>
                        {sessions.filter(s => new Date(s.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length} sessions this week
                    </Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{totalHours.toFixed(1)}h</Text>
                        <Text style={styles.statLabel}>Total Hours</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {sessions.reduce((sum, s) => sum + s.sessions, 0)}
                        </Text>
                        <Text style={styles.statLabel}>Total Sessions</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{sessions.length}</Text>
                        <Text style={styles.statLabel}>Active Days</Text>
                    </View>
                </View>

                {/* Session History */}
                <View style={styles.historyContainer}>
                    <Text style={styles.sectionTitle}>Session History</Text>
                    {sessions.length > 0 ? (
                        <FlatList
                            data={sessions}
                            renderItem={renderSessionItem}
                            keyExtractor={(item) => item.date}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="time-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyTitle}>No sessions yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Start chatting with MindCare AI to track your mindful hours
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#FFFFFF',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#5D4037',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#8B7B73',
    },
    content: {
        flex: 1,
    },

    // Progress Card
    progressCard: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 15,
        padding: 20,
        borderRadius: 15,
        backgroundColor: '#F0F8E6',
        borderLeftWidth: 4,
        borderLeftColor: '#8DAA6D',
    },
    progressHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    progressText: {
        marginLeft: 12,
        flex: 1,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
    },
    progressValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#8DAA6D',
    },
    progressBarLarge: {
        height: 12,
        backgroundColor: '#E0E0E0',
        borderRadius: 6,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFillLarge: {
        height: '100%',
        backgroundColor: '#8DAA6D',
        borderRadius: 6,
    },
    progressSubtext: {
        fontSize: 12,
        color: '#8B7B73',
        fontStyle: 'italic',
    },

    // Stats
    statsContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 15,
        gap: 10,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 15,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#8DAA6D',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#8B7B73',
        textAlign: 'center',
    },

    // History
    historyContainer: {
        backgroundColor: '#FFFFFF',
        margin: 20,
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 15,
    },
    sessionItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#8DAA6D',
    },
    sessionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 2,
    },
    sessionType: {
        fontSize: 12,
        color: '#8B7B73',
    },
    sessionMetrics: {
        flexDirection: 'row',
        gap: 8,
    },
    metricBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    metricText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#8DAA6D',
        marginLeft: 4,
    },
    progressBarSmall: {
        height: 4,
        backgroundColor: '#E0E0E0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFillSmall: {
        height: '100%',
        backgroundColor: '#8DAA6D',
        borderRadius: 2,
    },

    // Empty state
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#8B7B73',
        marginTop: 10,
        marginBottom: 5,
    },
    emptySubtitle: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default MindfulHours;