import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '@/src/context/AuthContext';
import { api } from '@/src/api/config';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

// Enhanced interfaces for dashboard data
interface ChatbotAssessmentData {
    _id?: string;
    stressLevel: number;
    mood: string;
    severity: number;
    responses: string[];
    completedAt: string;
    recommendations: string;
    analysis: string;
}

interface TrendData {
    date: string;
    stressLevel: number;
    mood: string;
    improvement: number;
}

interface MindfulDashboardData {
    assessments: ChatbotAssessmentData[];
    totalAssessments: number;
    averageStressLevel: number;
    currentMood: string;
    sleepQuality: string;
    mindfulHours: number;
    journalStreak: number;
    lastAssessmentDate: string;
    moodTrend: string[];
    weeklyTrend: TrendData[];
    monthlyTrend: TrendData[];
    improvementPercentage: number;
    bestDay: string;
    worstDay: string;
    moodDistribution: { [key: string]: number };
}

const MindfulDashboard = () => {
    const navigation = useNavigation<NavigationProp>();
    const { userToken, userData } = useContext(AuthContext);
    const [dashboardData, setDashboardData] = useState<MindfulDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const assessmentResponse = await api.get('/api/chatbot/assessment-results', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            const conversationResponse = await api.get('/api/chatbot/history', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (assessmentResponse.data.success && conversationResponse.data.success) {
                const assessments = assessmentResponse.data.assessments || [];
                const conversations = conversationResponse.data.conversations || [];

                const processedData = processDashboardData(assessments, conversations);
                setDashboardData(processedData);
            } else {
                setDashboardData(getEmptyDashboardState());
            }

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setError('Failed to load dashboard data.');
            setDashboardData(getEmptyDashboardState());
        } finally {
            setLoading(false);
        }
    };

    const getEmptyDashboardState = (): MindfulDashboardData => ({
        assessments: [],
        totalAssessments: 0,
        averageStressLevel: 0,
        currentMood: 'neutral',
        sleepQuality: 'No data',
        mindfulHours: 0,
        journalStreak: 0,
        lastAssessmentDate: '',
        moodTrend: [],
        weeklyTrend: [],
        monthlyTrend: [],
        improvementPercentage: 0,
        bestDay: '',
        worstDay: '',
        moodDistribution: {}
    });

    const processDashboardData = (assessments: any[], conversations: any[]): MindfulDashboardData => {
        const now = new Date();
        const today = now.toDateString();
        const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Sort assessments by date
        const sortedAssessments = assessments.sort((a, b) =>
            new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );

        // Calculate metrics
        const recentAssessments = assessments.filter(a =>
            new Date(a.completedAt) >= thisWeek
        );

        const averageStressLevel = recentAssessments.length > 0
            ? recentAssessments.reduce((sum, a) => sum + (a.stressLevel || 0), 0) / recentAssessments.length
            : 0;

        const latestAssessment = assessments.sort((a, b) =>
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        )[0];

        const currentMood = latestAssessment?.mood || 'neutral';

        // Calculate mindful hours
        const todayConversations = conversations.filter(c =>
            new Date(c.createdAt || c.lastUpdated).toDateString() === today
        );
        const mindfulHours = todayConversations.length * 0.25;

        // Calculate trends
        const weeklyTrend = calculateWeeklyTrend(sortedAssessments);
        const monthlyTrend = calculateMonthlyTrend(sortedAssessments);
        const improvementPercentage = calculateImprovement(sortedAssessments);
        const { bestDay, worstDay } = findBestWorstDays(assessments);
        const moodDistribution = calculateMoodDistribution(assessments);
        const journalStreak = calculateStreakDays(assessments);
        const moodTrend = getMoodTrend(assessments);

        return {
            assessments,
            totalAssessments: assessments.length,
            averageStressLevel,
            currentMood,
            sleepQuality: 'Average',
            mindfulHours,
            journalStreak,
            lastAssessmentDate: latestAssessment?.completedAt || '',
            moodTrend,
            weeklyTrend,
            monthlyTrend,
            improvementPercentage,
            bestDay,
            worstDay,
            moodDistribution
        };
    };

    const calculateWeeklyTrend = (assessments: any[]): TrendData[] => {
        const weeklyData: TrendData[] = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toDateString();

            const dayAssessments = assessments.filter(a =>
                new Date(a.completedAt).toDateString() === dateStr
            );

            if (dayAssessments.length > 0) {
                const avgStress = dayAssessments.reduce((sum, a) => sum + (a.stressLevel || 0), 0) / dayAssessments.length;
                const mood = dayAssessments[dayAssessments.length - 1].mood;

                weeklyData.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    stressLevel: avgStress,
                    mood: mood,
                    improvement: i === 6 ? 0 : calculateDayImprovement(avgStress, weeklyData[weeklyData.length - 1]?.stressLevel || 0)
                });
            } else {
                weeklyData.push({
                    date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    stressLevel: 0,
                    mood: 'neutral',
                    improvement: 0
                });
            }
        }

        return weeklyData;
    };

    const calculateMonthlyTrend = (assessments: any[]): TrendData[] => {
        const monthlyData: TrendData[] = [];
        const now = new Date();

        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
            const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

            const weekAssessments = assessments.filter(a => {
                const assessmentDate = new Date(a.completedAt);
                return assessmentDate >= weekStart && assessmentDate < weekEnd;
            });

            if (weekAssessments.length > 0) {
                const avgStress = weekAssessments.reduce((sum, a) => sum + (a.stressLevel || 0), 0) / weekAssessments.length;
                const mood = weekAssessments[weekAssessments.length - 1].mood;

                monthlyData.push({
                    date: `Week ${4 - i}`,
                    stressLevel: avgStress,
                    mood: mood,
                    improvement: calculateDayImprovement(avgStress, monthlyData[monthlyData.length - 1]?.stressLevel || 0)
                });
            }
        }

        return monthlyData;
    };

    const calculateImprovement = (assessments: any[]): number => {
        if (assessments.length < 2) return 0;

        const firstWeek = assessments.slice(0, Math.min(7, assessments.length));
        const lastWeek = assessments.slice(-7);

        const firstAvg = firstWeek.reduce((sum, a) => sum + (a.stressLevel || 0), 0) / firstWeek.length;
        const lastAvg = lastWeek.reduce((sum, a) => sum + (a.stressLevel || 0), 0) / lastWeek.length;

        return ((firstAvg - lastAvg) / firstAvg) * 100;
    };

    const calculateDayImprovement = (current: number, previous: number): number => {
        if (previous === 0) return 0;
        return ((previous - current) / previous) * 100;
    };

    const findBestWorstDays = (assessments: any[]) => {
        if (assessments.length === 0) return { bestDay: '', worstDay: '' };

        const sorted = [...assessments].sort((a, b) => (a.stressLevel || 0) - (b.stressLevel || 0));

        return {
            bestDay: new Date(sorted[0].completedAt).toLocaleDateString(),
            worstDay: new Date(sorted[sorted.length - 1].completedAt).toLocaleDateString()
        };
    };

    const calculateMoodDistribution = (assessments: any[]) => {
        const distribution: { [key: string]: number } = {};

        assessments.forEach(a => {
            const mood = a.mood || 'neutral';
            distribution[mood] = (distribution[mood] || 0) + 1;
        });

        return distribution;
    };

    const calculateStreakDays = (assessments: any[]): number => {
        if (assessments.length === 0) return 0;

        const dates = assessments
            .map(a => new Date(a.completedAt).toDateString())
            .filter((date, index, array) => array.indexOf(date) === index)
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        let streak = 0;
        let currentDate = new Date();

        for (let i = 0; i < Math.min(dates.length, 30); i++) {
            const dateStr = currentDate.toDateString();
            if (dates.includes(dateStr)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    };

    const getMoodTrend = (assessments: any[]): string[] => {
        const lastWeek = assessments
            .filter(a => {
                const assessmentDate = new Date(a.completedAt);
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return assessmentDate >= weekAgo;
            })
            .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
            .map(a => a.mood);

        return lastWeek.slice(-3);
    };

    const getStressLevelColor = (level: number): string => {
        if (level <= 2) return '#8DAA6D';
        if (level <= 3) return '#F0CA00';
        return '#E74C3C';
    };

    const getImprovementIcon = (improvement: number) => {
        if (improvement > 10) return { icon: 'trending-up', color: '#8DAA6D' };
        if (improvement < -10) return { icon: 'trending-down', color: '#E74C3C' };
        return { icon: 'remove', color: '#F0CA00' };
    };

    const getMoodIcon = (mood: string): "sad" | "happy" | "remove" => {
        switch (mood.toLowerCase()) {
            case 'depression':
            case 'sad':
                return 'sad';
            case 'positive':
            case 'happy':
                return 'happy';
            case 'neutral':
            default:
                return 'remove';
        }
    };

    const formatMoodLabel = (mood: string): string => {
        return mood.charAt(0).toUpperCase() + mood.slice(1);
    };

    const renderTrendChart = () => {
        const data = selectedPeriod === 'week' ? dashboardData?.weeklyTrend : dashboardData?.monthlyTrend;
        if (!data || data.length === 0) return null;

        const maxStress = Math.max(...data.map(d => d.stressLevel));
        const chartHeight = 100;

        return (
            <View style={styles.chartContainer}>
                <View style={styles.periodSelector}>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'week' && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod('week')}
                    >
                        <Text style={[styles.periodButtonText, selectedPeriod === 'week' && styles.periodButtonTextActive]}>
                            Week
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodButton, selectedPeriod === 'month' && styles.periodButtonActive]}
                        onPress={() => setSelectedPeriod('month')}
                    >
                        <Text style={[styles.periodButtonText, selectedPeriod === 'month' && styles.periodButtonTextActive]}>
                            Month
                        </Text>
                    </TouchableOpacity>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chart}>
                    <View style={styles.chartContent}>
                        {data.map((point, index) => (
                            <View key={index} style={styles.chartPoint}>
                                <View style={styles.chartBar}>
                                    <View
                                        style={[
                                            styles.chartBarFill,
                                            {
                                                height: maxStress > 0 ? (point.stressLevel / maxStress) * chartHeight : 0,
                                                backgroundColor: getStressLevelColor(point.stressLevel)
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.chartLabel}>{point.date}</Text>
                                <View style={styles.improvementIndicator}>
                                    <Ionicons
                                        name={getImprovementIcon(point.improvement).icon as any}
                                        size={12}
                                        color={getImprovementIcon(point.improvement).color}
                                    />
                                    <Text style={[styles.improvementText, { color: getImprovementIcon(point.improvement).color }]}>
                                        {point.improvement > 0 ? '+' : ''}{point.improvement.toFixed(0)}%
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>
            </View>
        );
    };

    const renderMoodDistribution = () => {
        if (!dashboardData?.moodDistribution) return null;

        const total = Object.values(dashboardData.moodDistribution).reduce((sum, count) => sum + count, 0);
        if (total === 0) return null;

        return (
            <View style={styles.moodDistributionContainer}>
                <Text style={styles.sectionSubtitle}>Mood Distribution</Text>
                {Object.entries(dashboardData.moodDistribution).map(([mood, count]) => (
                    <View key={mood} style={styles.moodDistributionItem}>
                        <View style={styles.moodDistributionLabel}>
                            <Ionicons name={getMoodIcon(mood)} size={16} color="#8B7B73" />
                            <Text style={styles.moodDistributionText}>{formatMoodLabel(mood)}</Text>
                        </View>
                        <View style={styles.moodDistributionBar}>
                            <View
                                style={[
                                    styles.moodDistributionBarFill,
                                    {
                                        width: `${(count / total) * 100}%`,
                                        backgroundColor: mood === 'depression' ? '#E18942' :
                                            mood === 'positive' ? '#8DAA6D' : '#8B7B73'
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.moodDistributionPercentage}>
                            {((count / total) * 100).toFixed(0)}%
                        </Text>
                    </View>
                ))}
            </View>
        );
    };

    if (loading) {
        return (
            <ScrollView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8DAA6D" />
                    <Text style={styles.loadingText}>Loading dashboard...</Text>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#5D4037" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Mindful Dashboard</Text>
                <TouchableOpacity onPress={fetchDashboardData}>
                    <Feather name="refresh-cw" size={24} color="#5D4037" />
                </TouchableOpacity>
            </View>

            {/* Overall Improvement Card */}
            {dashboardData && dashboardData.totalAssessments > 1 && (
                <View style={styles.improvementCard}>
                    <View style={styles.improvementHeader}>
                        <MaterialCommunityIcons name="chart-line" size={32} color="#8DAA6D" />
                        <View style={styles.improvementText}>
                            <Text style={styles.improvementTitle}>Overall Progress</Text>
                            <Text style={[
                                styles.improvementValue,
                                { color: dashboardData.improvementPercentage >= 0 ? '#8DAA6D' : '#E74C3C' }
                            ]}>
                                {dashboardData.improvementPercentage >= 0 ? '+' : ''}
                                {dashboardData.improvementPercentage.toFixed(1)}%
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.improvementSubtext}>
                        {dashboardData.improvementPercentage >= 0 ? 'You\'re improving!' : 'Keep working on it!'}
                        {dashboardData.bestDay && ` Best day: ${dashboardData.bestDay}`}
                    </Text>
                </View>
            )}

            {/* Trend Chart */}
            {dashboardData && dashboardData.totalAssessments > 0 && renderTrendChart()}

            {/* Quick Stats Row */}
            <View style={styles.quickStatsRow}>
                <View style={styles.quickStatCard}>
                    <Ionicons name="flash" size={20} color="#F0CA00" />
                    <Text style={styles.quickStatNumber}>
                        {dashboardData?.averageStressLevel.toFixed(1) || '0'}
                    </Text>
                    <Text style={styles.quickStatLabel}>Avg Stress</Text>
                </View>
                <View style={styles.quickStatCard}>
                    <Ionicons name="trophy" size={20} color="#E18942" />
                    <Text style={styles.quickStatNumber}>
                        {dashboardData?.journalStreak || 0}
                    </Text>
                    <Text style={styles.quickStatLabel}>Day Streak</Text>
                </View>
                <View style={styles.quickStatCard}>
                    <Ionicons name="time" size={20} color="#8DAA6D" />
                    <Text style={styles.quickStatNumber}>
                        {dashboardData?.mindfulHours.toFixed(1) || '0'}h
                    </Text>
                    <Text style={styles.quickStatLabel}>Today</Text>
                </View>
                <View style={styles.quickStatCard}>
                    <Ionicons name="calendar" size={20} color="#9B7FD4" />
                    <Text style={styles.quickStatNumber}>
                        {dashboardData?.totalAssessments || 0}
                    </Text>
                    <Text style={styles.quickStatLabel}>Total</Text>
                </View>
            </View>

            {/* Mood Distribution */}
            {dashboardData && renderMoodDistribution()}

            {/* Additional insights */}
            {dashboardData && dashboardData.totalAssessments > 5 && (
                <View style={styles.insightsContainer}>
                    <Text style={styles.sectionSubtitle}>Insights & Recommendations</Text>

                    <View style={styles.insightCard}>
                        <Ionicons name="bulb" size={20} color="#F6BD60" />
                        <View style={styles.insightText}>
                            <Text style={styles.insightTitle}>
                                {dashboardData.improvementPercentage > 0 ? 'Great Progress!' : 'Room for Improvement'}
                            </Text>
                            <Text style={styles.insightDescription}>
                                {dashboardData.improvementPercentage > 0
                                    ? 'Your stress levels are trending downward. Keep up the good work!'
                                    : 'Consider increasing your mindful sessions and trying new coping strategies.'
                                }
                            </Text>
                        </View>
                    </View>

                    <View style={styles.insightCard}>
                        <Ionicons name="trophy" size={20} color="#8DAA6D" />
                        <View style={styles.insightText}>
                            <Text style={styles.insightTitle}>Weekly Goal</Text>
                            <Text style={styles.insightDescription}>
                                Try to complete at least {Math.max(7 - dashboardData.journalStreak, 1)} more assessments this week.
                            </Text>
                        </View>
                    </View>
                </View>
            )}

            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchDashboardData} style={styles.retryButton}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={{ height: 50 }} />
        </ScrollView>
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
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#8B7B73',
    },
    sectionSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 10,
    },

    // Improvement Card
    improvementCard: {
        marginHorizontal: 20,
        marginBottom: 15,
        marginTop: 10,
        padding: 15,
        borderRadius: 15,
        backgroundColor: '#F0F8E6',
        borderLeftWidth: 4,
        borderLeftColor: '#8DAA6D',
    },
    improvementHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    improvementText: {
        marginLeft: 12,
        flex: 1,
    },
    improvementTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
    },
    improvementValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    improvementSubtext: {
        fontSize: 13,
        color: '#8B7B73',
        fontStyle: 'italic',
    },

    // Chart Styles
    chartContainer: {
        marginHorizontal: 20,
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 4,
        marginBottom: 15,
    },
    periodButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    periodButtonActive: {
        backgroundColor: '#8DAA6D',
    },
    periodButtonText: {
        fontSize: 14,
        color: '#8B7B73',
        fontWeight: '500',
    },
    periodButtonTextActive: {
        color: '#FFFFFF',
    },
    chart: {
        height: 140,
    },
    chartContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 140,
        paddingHorizontal: 10,
    },
    chartPoint: {
        alignItems: 'center',
        marginHorizontal: 8,
        minWidth: 60,
    },
    chartBar: {
        width: 20,
        height: 100,
        backgroundColor: '#F0F0F0',
        borderRadius: 10,
        justifyContent: 'flex-end',
        overflow: 'hidden',
    },
    chartBarFill: {
        width: '100%',
        borderRadius: 10,
        minHeight: 2,
    },
    chartLabel: {
        fontSize: 10,
        color: '#8B7B73',
        marginTop: 4,
        textAlign: 'center',
    },
    improvementIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },

    // Quick Stats
    quickStatsRow: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 15,
        gap: 10,
    },
    quickStatCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    quickStatNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#5D4037',
        marginTop: 4,
    },
    quickStatLabel: {
        fontSize: 10,
        color: '#8B7B73',
        marginTop: 2,
        textAlign: 'center',
    },

    // Mood Distribution
    moodDistributionContainer: {
        marginHorizontal: 20,
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    moodDistributionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    moodDistributionLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 80,
    },
    moodDistributionText: {
        fontSize: 12,
        color: '#5D4037',
        marginLeft: 4,
    },
    moodDistributionBar: {
        flex: 1,
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    moodDistributionBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    moodDistributionPercentage: {
        fontSize: 12,
        color: '#8B7B73',
        width: 35,
        textAlign: 'right',
    },

    // Insights
    insightsContainer: {
        marginHorizontal: 20,
        marginBottom: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    insightCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 15,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    insightText: {
        flex: 1,
        marginLeft: 12,
    },
    insightTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 4,
    },
    insightDescription: {
        fontSize: 12,
        color: '#8B7B73',
        lineHeight: 16,
    },

    errorContainer: {
        margin: 20,
        padding: 15,
        backgroundColor: '#FFE6E6',
        borderRadius: 10,
        alignItems: 'center',
    },
    errorText: {
        color: '#E74C3C',
        fontSize: 14,
        marginBottom: 10,
    },
    retryButton: {
        backgroundColor: '#E74C3C',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 6,
    },
    retryText: {
        color: '#FFF',
        fontWeight: '600',
    },
});

export default MindfulDashboard;