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

interface SleepData {
    date: string;
    quality: string;
    score: number;
    source: 'assessment' | 'manual';
}

const SleepQuality = () => {
    const navigation = useNavigation<NavigationProp>();
    const { userToken } = useContext(AuthContext);
    const [sleepData, setSleepData] = useState<SleepData[]>([]);
    const [loading, setLoading] = useState(true);
    const [averageScore, setAverageScore] = useState(0);

    useEffect(() => {
        fetchSleepData();
    }, []);

    const fetchSleepData = async () => {
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
                const processedSleep = processSleepData(assessments);
                setSleepData(processedSleep);

                if (processedSleep.length > 0) {
                    const avg = processedSleep.reduce((sum, data) => sum + data.score, 0) / processedSleep.length;
                    setAverageScore(avg);
                }
            }
        } catch (error) {
            console.error('Error fetching sleep data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processSleepData = (assessments: any[]): SleepData[] => {
        return assessments
            .filter(assessment => assessment.responses && assessment.responses[2])
            .map(assessment => {
                const sleepResponse = assessment.responses[2];
                const score = getSleepScoreFromResponse(sleepResponse);

                return {
                    date: assessment.completedAt,
                    quality: sleepResponse,
                    score,
                    source: 'assessment' as const
                };
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const getSleepScoreFromResponse = (response: string): number => {
        const responseLower = response.toLowerCase();
        if (responseLower.includes('very poor')) return 2;
        if (responseLower.includes('poor')) return 4;
        if (responseLower.includes('average')) return 6;
        if (responseLower.includes('good') && !responseLower.includes('very')) return 8;
        if (responseLower.includes('very good')) return 9;
        return 6;
    };

    const getSleepQualityColor = (score: number): string => {
        if (score >= 8) return '#8DAA6D';
        if (score >= 6) return '#F0CA00';
        if (score >= 4) return '#E18942';
        return '#E74C3C';
    };

    const getSleepIcon = (score: number): string => {
        if (score >= 8) return '😴';
        if (score >= 6) return '😊';
        if (score >= 4) return '😐';
        return '😵';
    };

    const renderSleepItem = ({ item }: { item: SleepData }) => (
        <View style={styles.sleepItem}>
            <View style={styles.sleepHeader}>
                <View style={styles.sleepInfo}>
                    <Text style={styles.sleepDate}>
                        {new Date(item.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                        })}
                    </Text>
                    <Text style={styles.sleepQuality}>{item.quality}</Text>
                </View>
                <View style={styles.sleepMetrics}>
                    <View style={[
                        styles.scoreCircle,
                        { backgroundColor: getSleepQualityColor(item.score) }
                    ]}>
                        <Text style={styles.scoreText}>{item.score}</Text>
                    </View>
                    <Text style={styles.sleepEmoji}>{getSleepIcon(item.score)}</Text>
                </View>
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
                    <Text style={styles.headerTitle}>Sleep Quality</Text>
                    <View style={{ width: 24 }} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#9B7FD4" />
                    <Text style={styles.loadingText}>Loading your sleep data...</Text>
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
                <Text style={styles.headerTitle}>Sleep Quality</Text>
                <TouchableOpacity onPress={fetchSleepData}>
                    <Ionicons name="refresh" size={24} color="#5D4037" />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Average Overview */}
                <View style={styles.overviewCard}>
                    <View style={styles.overviewHeader}>
                        <Ionicons name="moon" size={32} color="#9B7FD4" />
                        <View style={styles.overviewText}>
                            <Text style={styles.overviewTitle}>Average Sleep Quality</Text>
                            <Text style={[
                                styles.overviewValue,
                                { color: getSleepQualityColor(averageScore) }
                            ]}>
                                {averageScore.toFixed(1)}/10
                            </Text>
                        </View>
                        <Text style={styles.overviewEmoji}>{getSleepIcon(averageScore)}</Text>
                    </View>
                    <Text style={styles.overviewSubtext}>
                        Based on {sleepData.length} assessments
                    </Text>
                </View>

                {/* Quick Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {sleepData.filter(d => d.score >= 8).length}
                        </Text>
                        <Text style={styles.statLabel}>Good Nights</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>
                            {sleepData.filter(d => d.score <= 4).length}
                        </Text>
                        <Text style={styles.statLabel}>Poor Nights</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statNumber}>{sleepData.length}</Text>
                        <Text style={styles.statLabel}>Total Records</Text>
                    </View>
                </View>

                {/* Sleep History */}
                <View style={styles.historyContainer}>
                    <Text style={styles.sectionTitle}>Sleep History</Text>
                    {sleepData.length > 0 ? (
                        <FlatList
                            data={sleepData}
                            renderItem={renderSleepItem}
                            keyExtractor={(item) => item.date}
                            scrollEnabled={false}
                        />
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="moon-outline" size={48} color="#CCC" />
                            <Text style={styles.emptyTitle}>No sleep data yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Complete chatbot assessments to track your sleep quality
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
        backgroundColor: '#F0E6FF',
        borderLeftWidth: 4,
        borderLeftColor: '#9B7FD4',
    },
    overviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    overviewText: {
        marginLeft: 12,
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
    overviewEmoji: {
        fontSize: 32,
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
        color: '#9B7FD4',
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
    sleepItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#9B7FD4',
    },
    sleepHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sleepInfo: {
        flex: 1,
    },
    sleepDate: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 2,
    },
    sleepQuality: {
        fontSize: 12,
        color: '#8B7B73',
    },
    sleepMetrics: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    scoreCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
    },
    sleepEmoji: {
        fontSize: 24,
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

export default SleepQuality;