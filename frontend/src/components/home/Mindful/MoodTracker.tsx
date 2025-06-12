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

interface MoodData {
    date: string;
    mood: string;
    stressLevel: number;
    analysis?: string;
    source: 'assessment' | 'manual';
}

const MoodTracker = () => {
    const navigation = useNavigation<NavigationProp>();
    const { userToken } = useContext(AuthContext);
    const [moodData, setMoodData] = useState<MoodData[]>([]);
    const [loading, setLoading] = useState(true);
    const [moodDistribution, setMoodDistribution] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        fetchMoodData();
    }, []);

    const fetchMoodData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/chatbot/assessment-results', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const assessments = response.data.assessments || [];
                const processedMood = processMoodData(assessments);
                setMoodData(processedMood);
                calculateMoodDistribution(processedMood);
            }
        } catch (error) {
            console.error('Error fetching mood data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processMoodData = (assessments: any[]): MoodData[] => {
        return assessments
            .filter(assessment => assessment.mood)
            .map(assessment => ({
                date: assessment.completedAt,
                mood: assessment.mood,
                stressLevel: assessment.stressLevel || 0,
                analysis: assessment.analysis,
                source: 'assessment' as const
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const calculateMoodDistribution = (data: MoodData[]) => {
        const distribution: { [key: string]: number } = {};

        data.forEach(item => {
            distribution[item.mood] = (distribution[item.mood] || 0) + 1;
        });

        setMoodDistribution(distribution);
    };

    const getMoodEmoji = (mood: string): string => {
        switch (mood?.toLowerCase()) {
            case 'depression':
            case 'sad':
                return '😢';
            case 'positive':
            case 'happy':
                return '😊';
            case 'anxious':
            case 'anxiety':
                return '😰';
            case 'stressed':
            case 'stress':
                return '😤';
            case 'calm':
                return '😌';
            case 'excited':
                return '🤗';
            case 'angry':
                return '😠';
            case 'neutral':
            default:
                return '😐';
        }
    };

    const getMoodColor = (mood: string): string => {
        switch (mood?.toLowerCase()) {
            case 'depression':
            case 'sad':
                return '#E74C3C';
            case 'positive':
            case 'happy':
                return '#8DAA6D';
            case 'anxious':
            case 'anxiety':
                return '#9B7FD4';
            case 'stressed':
            case 'stress':
                return '#E18942';
            case 'calm':
                return '#6A8D73';
            case 'excited':
                return '#F6BD60';
            case 'angry':
                return '#C0392B';
            case 'neutral':
            default:
                return '#8B7B73';
        }
    };

    const formatMoodLabel = (mood: string): string => {
        return mood.charAt(0).toUpperCase() + mood.slice(1);
    };

    const getCurrentMood = (): MoodData | null => {
        return moodData.length > 0 ? moodData[0] : null;
    };

    const getMoodTrend = (): string => {
        if (moodData.length < 2) return 'Not enough data';

        const recent = moodData.slice(0, 3);
        const positiveCount = recent.filter(m => m.mood === 'positive').length;
        const depressionCount = recent.filter(m => m.mood === 'depression').length;

        if (positiveCount > depressionCount) return 'Improving';
        if (depressionCount > positiveCount) return 'Declining';
        return 'Stable';
    };

    const renderMoodItem = ({ item }: { item: MoodData }) => (
        <View style={styles.moodItem}>
            <View style={styles.moodHeader}>
                <View style={styles.moodInfo}>
                    <Text style={styles.moodDate}>
                        {new Date(item.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </Text>
                    <View style={styles.moodDetails}>
                        <View style={[
                            styles.moodBadge,
                            { backgroundColor: getMoodColor(item.mood) + '20' }
                        ]}>
                            <Text style={styles.moodEmoji}>{getMoodEmoji(item.mood)}</Text>
                            <Text style={[
                                styles.moodText,
                                { color: getMoodColor(item.mood) }
                            ]}>
                                {formatMoodLabel(item.mood)}
                            </Text>
                        </View>
                        <View style={styles.stressBadge}>
                            <Ionicons name="flash" size={12} color="#F0CA00" />
                            <Text style={styles.stressText}>Stress: {item.stressLevel}</Text>
                        </View>
                    </View>
                </View>
            </View>
            {item.analysis && (
                <Text style={styles.moodAnalysis} numberOfLines={2}>
                    {item.analysis}
                </Text>
            )}
        </View>
    );

    const renderMoodDistribution = () => {
        const total = Object.values(moodDistribution).reduce((sum, count) => sum + count, 0);
        if (total === 0) return null;

        return (
            <View style={styles.distributionContainer}>
                <Text style={styles.sectionTitle}>Mood Distribution</Text>
                {Object.entries(moodDistribution).map(([mood, count]) => (
                    <View key={mood} style={styles.distributionItem}>
                        <View style={styles.distributionLabel}>
                            <Text style={styles.distributionEmoji}>{getMoodEmoji(mood)}</Text>
                            <Text style={styles.distributionText}>{formatMoodLabel(mood)}</Text>
                        </View>
                        <View style={styles.distributionBar}>
                            <View
                                style={[
                                    styles.distributionBarFill,
                                    {
                                        width: `${(count / total) * 100}%`,
                                        backgroundColor: getMoodColor(mood)
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.distributionPercentage}>
                            {((count / total) * 100).toFixed(0)}%
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#5D4037" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Mood Tracker</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8DAA6D" />
                    <Text style={styles.loadingText}>Loading your mood data...</Text>
                </View>
            </View>
        );
    }

    const currentMood = getCurrentMood();
    const trend = getMoodTrend();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#5D4037" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mood Tracker</Text>
                <TouchableOpacity onPress={fetchMoodData}>
                    <Ionicons name="refresh" size={24} color="#5D4037" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Current Mood Overview */}
                {currentMood && (
                    <View style={styles.overviewCard}>
                        <View style={styles.overviewHeader}>
                            <Text style={styles.currentMoodEmoji}>
                                {getMoodEmoji(currentMood.mood)}
                            </Text>
                            <View style={styles.overviewText}>
                                <Text style={styles.overviewTitle}>Current Mood</Text>
                                <Text style={[
                                    styles.overviewValue,
                                    { color: getMoodColor(currentMood.mood) }
                                ]}>
                                    {formatMoodLabel(currentMood.mood)}
                                </Text>
                            </View>
                            <View style={styles.trendIndicator}>
                                <Text style={styles.trendText}>{trend}</Text>
                                <Ionicons
                                    name={trend === 'Improving' ? 'trending-up' :
                                        trend === 'Declining' ? 'trending-down' : 'remove'}
                                    size={16}
                                    color={trend === 'Improving' ? '#8DAA6D' :
                                        trend === 'Declining' ? '#E74C3C' : '#8B7B73'}
                                />
                            </View>
                        </View>
                        <Text style={styles.overviewSubtext}>
                            Last updated: {new Date(currentMood.date).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{moodData.length}</Text>
                        <Text style={styles.statLabel}>Total Records</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {moodData.filter(m => m.mood === 'positive').length}
                        </Text>
                        <Text style={styles.statLabel}>Positive Days</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {moodData.length > 0 ?
                                (moodData.reduce((sum, m) => sum + m.stressLevel, 0) / moodData.length).toFixed(1)
                                : '0'
                            }
                        </Text>
                        <Text style={styles.statLabel}>Avg Stress</Text>
                    </View>
                </View>

                {/* Mood Distribution */}
                {renderMoodDistribution()}

                {/* Mood History */}
                <View style={styles.historyContainer}>
                    <Text style={styles.sectionTitle}>Mood History</Text>
                    {moodData.length > 0 ? (
                        <FlatList
                            data={moodData}
                            renderItem={renderMoodItem}
                            keyExtractor={(item) => item.date}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="happy-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyTitle}>No mood data yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Complete chatbot assessments to track your mood over time
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

    // Overview Card
    overviewCard: {
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 15,
        padding: 20,
        borderRadius: 15,
        backgroundColor: '#FFF8E6',
        borderLeftWidth: 4,
        borderLeftColor: '#F6BD60',
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    currentMoodEmoji: {
        fontSize: 40,
        marginRight: 15,
    },
    overviewText: {
        flex: 1,
    },
    overviewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
    },
    overviewValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    trendIndicator: {
        alignItems: 'center',
    },
    trendText: {
        fontSize: 12,
        color: '#8B7B73',
        marginBottom: 2,
    },
    overviewSubtext: {
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

    // Distribution
    distributionContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    distributionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    distributionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 100,
    },
    distributionEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    distributionText: {
        fontSize: 12,
        color: '#5D4037',
        fontWeight: '500',
    },
    distributionBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        marginHorizontal: 10,
        overflow: 'hidden',
    },
    distributionBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    distributionPercentage: {
        fontSize: 12,
        color: '#8B7B73',
        width: 35,
        textAlign: 'right',
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
    moodItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#8DAA6D',
    },
    moodHeader: {
        marginBottom: 8,
    },
    moodInfo: {
        flex: 1,
    },
    moodDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 6,
    },
    moodDetails: {
        flexDirection: 'row',
        gap: 8,
    },
    moodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    moodEmoji: {
        fontSize: 14,
        marginRight: 4,
    },
    moodText: {
        fontSize: 12,
        fontWeight: '600',
    },
    stressBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF9E6',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stressText: {
        fontSize: 11,
        color: '#F0CA00',
        fontWeight: '600',
        marginLeft: 4,
    },
    moodAnalysis: {
        fontSize: 12,
        color: '#5D4037',
        lineHeight: 16,
        fontStyle: 'italic',
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

export default MoodTracker;