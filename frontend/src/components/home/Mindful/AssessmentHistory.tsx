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

interface AssessmentItem {
    _id: string;
    stressLevel: number;
    mood: string;
    severity: number;
    responses: string[];
    completedAt: string;
    recommendations: string;
    analysis: string;
}

interface CalendarDay {
    date: string;
    hasAssessment: boolean;
    assessmentCount: number;
    mood?: string;
    stressLevel?: number;
}

const AssessmentHistory = () => {
    const navigation = useNavigation<NavigationProp>();
    const { userToken } = useContext(AuthContext);
    const [assessments, setAssessments] = useState<AssessmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
    const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);

    useEffect(() => {
        fetchAssessmentHistory();
    }, []);

    const fetchAssessmentHistory = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/chatbot/assessment-results', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success) {
                const assessmentData = response.data.assessments || [];
                setAssessments(assessmentData);
                generateCalendarData(assessmentData);
            }
        } catch (error) {
            console.error('Error fetching assessment history:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateCalendarData = (assessments: AssessmentItem[]) => {
        const calendar: CalendarDay[] = [];
        const today = new Date();

        // Generate last 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toDateString();

            const dayAssessments = assessments.filter(a =>
                new Date(a.completedAt).toDateString() === dateStr
            );

            const latestAssessment = dayAssessments[dayAssessments.length - 1];

            calendar.push({
                date: dateStr,
                hasAssessment: dayAssessments.length > 0,
                assessmentCount: dayAssessments.length,
                mood: latestAssessment?.mood,
                stressLevel: latestAssessment?.stressLevel
            });
        }

        setCalendarData(calendar);
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
            case 'neutral':
            default:
                return '😐';
        }
    };

    const getStressLevelColor = (level: number): string => {
        if (level <= 2) return '#8DAA6D';
        if (level <= 3) return '#F0CA00';
        return '#E74C3C';
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    const getAssessmentsForDate = (dateStr: string) => {
        return assessments.filter(a =>
            new Date(a.completedAt).toDateString() === dateStr
        );
    };

    const renderCalendarDay = ({ item }: { item: CalendarDay }) => {
        const isSelected = selectedDate === item.date;
        const date = new Date(item.date);
        const dayNumber = date.getDate();

        return (
            <TouchableOpacity
                style={[
                    styles.calendarDay,
                    item.hasAssessment && styles.calendarDayWithAssessment,
                    isSelected && styles.calendarDaySelected
                ]}
                onPress={() => setSelectedDate(isSelected ? null : item.date)}
            >
                <Text style={[
                    styles.calendarDayNumber,
                    item.hasAssessment && styles.calendarDayNumberActive,
                    isSelected && styles.calendarDayNumberSelected
                ]}>
                    {dayNumber}
                </Text>
                {item.hasAssessment && (
                    <View style={styles.calendarDayIndicator}>
                        <Text style={styles.calendarDayCount}>{item.assessmentCount}</Text>
                        {item.mood && (
                            <Text style={styles.calendarDayEmoji}>
                                {getMoodEmoji(item.mood)}
                            </Text>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    const renderAssessmentItem = ({ item }: { item: AssessmentItem }) => (
        <View style={styles.assessmentItem}>
            <View style={styles.assessmentHeader}>
                <View style={styles.assessmentInfo}>
                    <Text style={styles.assessmentDate}>
                        {new Date(item.completedAt).toLocaleString()}
                    </Text>
                    <View style={styles.assessmentMetrics}>
                        <View style={styles.metricBadge}>
                            <Text style={styles.metricLabel}>Mood</Text>
                            <Text style={styles.metricValue}>
                                {getMoodEmoji(item.mood)} {item.mood}
                            </Text>
                        </View>
                        <View style={[
                            styles.metricBadge,
                            { backgroundColor: getStressLevelColor(item.stressLevel) + '20' }
                        ]}>
                            <Text style={styles.metricLabel}>Stress</Text>
                            <Text style={[
                                styles.metricValue,
                                { color: getStressLevelColor(item.stressLevel) }
                            ]}>
                                Level {item.stressLevel}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {item.analysis && (
                <Text style={styles.assessmentAnalysis} numberOfLines={2}>
                    {item.analysis}
                </Text>
            )}
        </View>
    );

    const calculateStreak = () => {
        let streak = 0;
        let currentDate = new Date();

        for (let i = 0; i < calendarData.length; i++) {
            const dateStr = currentDate.toDateString();
            const dayData = calendarData.find(d => d.date === dateStr);

            if (dayData?.hasAssessment) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color="#5D4037" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Assessment History</Text>
                    <View style={{ width: 24 }} />
                </View>

                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8DAA6D" />
                    <Text style={styles.loadingText}>Loading your history...</Text>
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
                <Text style={styles.headerTitle}>Assessment History</Text>
                <TouchableOpacity
                    onPress={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
                >
                    <Ionicons
                        name={viewMode === 'calendar' ? 'list' : 'calendar'}
                        size={24}
                        color="#5D4037"
                    />
                </TouchableOpacity>
            </View>

            {/* Stats Overview */}
            <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{calculateStreak()}</Text>
                    <Text style={styles.statLabel}>Current Streak</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{assessments.length}</Text>
                    <Text style={styles.statLabel}>Total Assessments</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statNumber}>
                        {calendarData.filter(d => d.hasAssessment).length}
                    </Text>
                    <Text style={styles.statLabel}>Active Days</Text>
                </View>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {viewMode === 'calendar' ? (
                    <>
                        {/* Calendar View */}
                        <View style={styles.calendarContainer}>
                            <Text style={styles.sectionTitle}>Last 30 Days</Text>
                            <FlatList
                                data={calendarData}
                                renderItem={renderCalendarDay}
                                keyExtractor={(item) => item.date}
                                numColumns={7}
                                scrollEnabled={false}
                                style={styles.calendar}
                            />
                        </View>

                        {/* Selected Date Details */}
                        {selectedDate && (
                            <View style={styles.selectedDateContainer}>
                                <Text style={styles.selectedDateTitle}>
                                    {formatDate(selectedDate)}
                                </Text>
                                <FlatList
                                    data={getAssessmentsForDate(selectedDate)}
                                    renderItem={renderAssessmentItem}
                                    keyExtractor={(item) => item._id}
                                    scrollEnabled={false}
                                />
                            </View>
                        )}
                    </>
                ) : (
                    /* List View */
                    <View style={styles.listContainer}>
                        <Text style={styles.sectionTitle}>All Assessments</Text>
                        <FlatList
                            data={assessments.sort((a, b) =>
                                new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                            )}
                            renderItem={renderAssessmentItem}
                            keyExtractor={(item) => item._id}
                            scrollEnabled={false}
                        />
                    </View>
                )}
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

    // Stats
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 15,
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
        fontSize: 24,
        fontWeight: 'bold',
        color: '#8DAA6D',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#8B7B73',
        textAlign: 'center',
    },

    // Calendar
    calendarContainer: {
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
    calendar: {
        marginTop: 10,
    },
    calendarDay: {
        width: (width - 80) / 7,
        aspectRatio: 1,
        margin: 2,
        borderRadius: 8,
        backgroundColor: '#F5F5F5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    calendarDayWithAssessment: {
        backgroundColor: '#E18942',
    },
    calendarDaySelected: {
        backgroundColor: '#8DAA6D',
    },
    calendarDayNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8B7B73',
    },
    calendarDayNumberActive: {
        color: '#FFFFFF',
    },
    calendarDayNumberSelected: {
        color: '#FFFFFF',
    },
    calendarDayIndicator: {
        position: 'absolute',
        bottom: 2,
        alignItems: 'center',
    },
    calendarDayCount: {
        fontSize: 8,
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    calendarDayEmoji: {
        fontSize: 8,
    },

    // Selected Date
    selectedDateContainer: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    selectedDateTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 10,
    },

    // Assessment Items
    assessmentItem: {
        backgroundColor: '#F8F9FA',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#8DAA6D',
    },
    assessmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    assessmentInfo: {
        flex: 1,
    },
    assessmentDate: {
        fontSize: 12,
        color: '#8B7B73',
        marginBottom: 6,
    },
    assessmentMetrics: {
        flexDirection: 'row',
        gap: 8,
    },
    metricBadge: {
        backgroundColor: '#F0F0F0',
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    metricLabel: {
        fontSize: 10,
        color: '#8B7B73',
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 11,
        fontWeight: '600',
        color: '#5D4037',
    },
    assessmentAnalysis: {
        fontSize: 12,
        color: '#5D4037',
        lineHeight: 16,
        fontStyle: 'italic',
    },

    // List View
    listContainer: {
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
        marginBottom: 10,
    },
});

export default AssessmentHistory;