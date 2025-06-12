import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AssessmentData } from '@/src/store/Store';
import { AuthContext } from '@/src/context/AuthContext';
import { api } from '@/src/api/config';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { useNavigation } from '@react-navigation/native';
import TrackerCards from './TrackerCards';
import { MindfulTrackerData, processTrackerData } from '@/src/constants/HelperMindful';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface MindfulTrackerProps {
    backendAssessmentData: AssessmentData | null;
    assessmentData: AssessmentData | null;
    isLoading: boolean;
    onRefresh?: () => void;
}

const MindfulTracker = ({ backendAssessmentData, assessmentData, isLoading, onRefresh }: MindfulTrackerProps) => {
    const { userToken } = useContext(AuthContext);
    const [trackerData, setTrackerData] = useState<MindfulTrackerData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigation = useNavigation<NavigationProp>();

    useEffect(() => {
        fetchMindfulTrackerData();
    }, []);

    useEffect(() => {
        if (assessmentData) {
            fetchMindfulTrackerData();
        }
    }, [assessmentData]);

    const fetchMindfulTrackerData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [assessmentResponse, conversationResponse] = await Promise.all([
                api.get('/api/chatbot/assessment-results', {
                    headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' }
                }),
                api.get('/api/chatbot/history', {
                    headers: { 'Authorization': `Bearer ${userToken}`, 'Content-Type': 'application/json' }
                })
            ]);

            if (assessmentResponse.data.success && conversationResponse.data.success) {
                const assessments = assessmentResponse.data.assessments || [];
                const conversations = conversationResponse.data.conversations || [];
                const processedData = processTrackerData(assessments, conversations);
                setTrackerData(processedData);
            } else {
                setTrackerData(getEmptyTrackerData());
            }
        } catch (error) {
            console.error('Error fetching mindful tracker data:', error);
            setError('Failed to load tracker data. Please complete a chatbot assessment first.');
            setTrackerData(getEmptyTrackerData());
        } finally {
            setLoading(false);
        }
    };

    const getEmptyTrackerData = (): MindfulTrackerData => ({
        assessments: [],
        totalAssessments: 0,
        averageStressLevel: 0,
        currentMood: 'neutral',
        sleepQuality: 'No data',
        mindfulHours: 0,
        journalStreak: 0,
        lastAssessmentDate: '',
        moodTrend: []
    });

    if (loading && !trackerData) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8DAA6D" />
                <Text style={styles.loadingText}>Loading your mindful data...</Text>
            </View>
        );
    }

    return (
        <>
            {/* Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mindful Tracker</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('MindfulDashboard')}
                        style={styles.dashboardButton}
                    >
                        <Ionicons name="analytics" size={20} color="#8DAA6D" />
                        <Text style={styles.dashboardButtonText}>Dashboard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={fetchMindfulTrackerData}>
                        <Feather name="refresh-cw" size={24} color="#5D4037" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Tracker Cards */}
            <TrackerCards trackerData={trackerData} />

            {/* Summary Card */}
            {trackerData && trackerData.totalAssessments > 0 && (
                <View style={styles.summaryCard}>
                    <View style={[styles.trackerIcon, { backgroundColor: '#E8F5E8' }]}>
                        <Ionicons name="analytics" size={24} color="#8DAA6D" />
                    </View>
                    <View style={styles.summaryContent}>
                        <Text style={styles.summaryTitle}>Summary</Text>
                        <Text style={styles.summaryValue}>
                            {trackerData.totalAssessments} total assessments completed
                        </Text>
                        {trackerData.lastAssessmentDate && (
                            <Text style={styles.summaryDate}>
                                Last: {new Date(trackerData.lastAssessmentDate).toLocaleDateString()}
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Error State */}
            {error && (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={fetchMindfulTrackerData} style={styles.retryButton}>
                        <Text style={styles.retryText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}
        </>
    );
};

const styles = StyleSheet.create({
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
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dashboardButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F8E6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#8DAA6D',
    },
    dashboardButtonText: {
        fontSize: 12,
        color: '#8DAA6D',
        fontWeight: '600',
        marginLeft: 4,
    },
    summaryCard: {
        flexDirection: 'row',
        marginHorizontal: 20,
        marginBottom: 15,
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
        padding: 10,
    },
    trackerIcon: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#F0F8E6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 15,
    },
    summaryContent: {
        flex: 1,
        justifyContent: 'center',
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 4,
    },
    summaryValue: {
        fontSize: 13,
        color: '#8B7B73',
        marginBottom: 2,
    },
    summaryDate: {
        fontSize: 11,
        color: '#999',
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

export default MindfulTracker;