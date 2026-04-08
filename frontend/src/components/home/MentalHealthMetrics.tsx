import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AssessmentData } from '@/src/store/Store';
import { AuthContext } from '@/src/context/AuthContext';
import { api } from '@/src/api/config';
import axios from 'axios';

// Get screen dimensions
const { width } = Dimensions.get('window');

interface MentalHealthMetricsProps {
    backendAssessmentData: AssessmentData | null;
    isLoading: boolean;
}

interface VitalSignsData {
    heartRate: number;
    systolicBP: number;
    diastolicBP: number;
    confidence: number;
    timestamp: number;
    date: string;
}

interface AssessmentResults {
    stressLevel: number;
    mood: string;
    severity: number;
    responses: string[];
    completedAt: string;
    analysis: string;
    recommendations: string;
}


const MentalHealthMetrics = ({ backendAssessmentData, isLoading }: MentalHealthMetricsProps) => {
    const [activeMetricIndex, setActiveMetricIndex] = useState(0);
    const [vitalSigns, setVitalSigns] = useState<VitalSignsData[]>([]);
    const [assessmentResults, setAssessmentResults] = useState<AssessmentResults[]>([]);
    const [loadingVitals, setLoadingVitals] = useState(true);
    const [loadingAssessments, setLoadingAssessments] = useState(true);
    const [currentHeartRate, setCurrentHeartRate] = useState<number>(72);
    const [averageHeartRate, setAverageHeartRate] = useState<number>(72);
    const [currentStressLevel, setCurrentStressLevel] = useState<number>(0);
    const [currentSystolic, setCurrentSystolic] = useState<number>(120);
    const [currentDiastolic, setCurrentDiastolic] = useState<number>(80);
    const { userToken } = useContext(AuthContext);

    useEffect(() => {
        if (userToken) {
            fetchVitalSigns();
            fetchAssessmentResults();
        }
    }, [userToken]);

    const fetchVitalSigns = async () => {
        try {
            setLoadingVitals(true);
            console.log('🔍 Fetching vital signs from backend...');

            const response = await api.get('/api/assessments/vitalSigns', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Vital Signs API Response:', response.data);

            if (response.data.success && response.data.vitalSigns) {
                const vitals = response.data.vitalSigns;

                // ✅ Sort by timestamp DESC to ensure latest is first
                const sortedVitals = [...vitals].sort((a, b) => b.timestamp - a.timestamp);
                setVitalSigns(sortedVitals);

                if (sortedVitals.length > 0) {
                    // ✅ Get the ABSOLUTE LAST (most recent) vital sign
                    const latestVital = sortedVitals[0];

                    console.log('💓 Latest vital sign (sorted):', {
                        heartRate: latestVital.heartRate,
                        timestamp: latestVital.timestamp,
                        date: new Date(latestVital.timestamp * 1000).toLocaleString()
                    });

                    // Set current values from ABSOLUTE latest reading
                    const currentHR = Math.round(latestVital.heartRate || 72);
                    const currentSys = Math.round(latestVital.systolicBP || 120);
                    const currentDia = Math.round(latestVital.diastolicBP || 80);

                    setCurrentHeartRate(currentHR);
                    setCurrentSystolic(currentSys);
                    setCurrentDiastolic(currentDia);

                    // Calculate average heart rate from recent readings (last 7 days)
                    const recentVitals = sortedVitals.slice(0, 7);
                    const totalHR = recentVitals.reduce((sum: number, vital: VitalSignsData) =>
                        sum + (vital.heartRate || 0), 0
                    );
                    const avgHR = recentVitals.length > 0 ? Math.round(totalHR / recentVitals.length) : 72;
                    setAverageHeartRate(avgHR);

                    console.log(`✅ Current HR: ${currentHR} BPM`);
                    console.log(`✅ Average HR (7 days): ${avgHR} BPM`);
                    console.log(`✅ BP: ${currentSys}/${currentDia} mmHg`);
                    console.log(`📅 Last reading: ${new Date(latestVital.timestamp * 1000).toLocaleString()}`);
                } else {
                    console.log('⚠️ No vital signs data available');
                }
            } else {
                console.log('⚠️ No vital signs found in response');
            }
        } catch (error) {
            console.error('❌ Error fetching vital signs:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response status:', error.response?.status);
                console.error('Response data:', error.response?.data);
            }
        } finally {
            setLoadingVitals(false);
        }
    };

    const fetchAssessmentResults = async () => {
        try {
            setLoadingAssessments(true);
            console.log('🔍 Fetching assessment results...');

            const response = await api.get('/api/chatbot/assessment-results', {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Assessment Results API Response:', response.data);

            if (response.data.success && response.data.assessments) {
                const assessments = response.data.assessments;
                setAssessmentResults(assessments);

                if (assessments.length > 0) {
                    // ✅ Get the LAST (most recent) assessment
                    const latestAssessment = assessments[0];
                    setCurrentStressLevel(latestAssessment.stressLevel || 0);

                    console.log(`✅ Current Stress Level: ${latestAssessment.stressLevel}/5`);
                    console.log(`✅ Current Mood: ${latestAssessment.mood}`);
                } else {
                    console.log('⚠️ No assessment results available');
                }
            }
        } catch (error) {
            console.error('❌ Error fetching assessment results:', error);
            if (axios.isAxiosError(error)) {
                console.error('Response status:', error.response?.status);
                console.error('Response data:', error.response?.data);
            }
        } finally {
            setLoadingAssessments(false);
        }
    };

    const getHeartRateCategory = (heartRate: number): { label: string; color: string } => {
        if (heartRate < 60) return { label: 'Low', color: '#5D9CEC' };
        if (heartRate >= 60 && heartRate <= 100) return { label: 'Normal', color: '#8DAA6D' };
        if (heartRate > 100 && heartRate <= 120) return { label: 'Elevated', color: '#F6BD60' };
        return { label: 'High', color: '#E74C3C' };
    };

    const getStressLevelCategory = (stressLevel: number): { label: string; color: string } => {
        if (stressLevel <= 1) return { label: 'Very Low', color: '#8DAA6D' };
        if (stressLevel <= 2) return { label: 'Low', color: '#9BC34A' };
        if (stressLevel <= 3) return { label: 'Normal', color: '#F6BD60' };
        if (stressLevel <= 4) return { label: 'High', color: '#FF9800' };
        return { label: 'Very High', color: '#E74C3C' };
    };

    const heartRateCategory = getHeartRateCategory(currentHeartRate);
    const stressCategory = getStressLevelCategory(currentStressLevel);

    const refreshData = () => {
        fetchVitalSigns();
        fetchAssessmentResults();
    };

    return (
        <>
            {/* Mental Health Metrics */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mental Health Metrics</Text>
                <TouchableOpacity onPress={refreshData}>
                    <Feather name="refresh-cw" size={24} color="#5D4037" />
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={(event) => {
                    const contentOffsetX = event.nativeEvent.contentOffset.x;
                    const newIndex = Math.round(contentOffsetX / width);
                    setActiveMetricIndex(newIndex);
                }}
                scrollEventThrottle={16}
            >
                <View style={styles.metricCard}>
                    <View style={[styles.metricCardContent, { backgroundColor: heartRateCategory.color }]}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="heart" size={22} color="#FFFFFF" />
                            <Text style={styles.metricTitle}>Heart Rate</Text>
                        </View>
                        <View style={styles.scoreCircleContainer}>
                            {loadingVitals ? (
                                <ActivityIndicator color="#FFFFFF" size="large" />
                            ) : (
                                <View style={styles.scoreCircle}>
                                    <Text style={styles.scoreNumber}>{currentHeartRate}</Text>
                                    <Text style={styles.scoreLabel}>{heartRateCategory.label}</Text>
                                    <Text style={styles.scoreBPM}>BPM</Text>
                                </View>
                            )}
                        </View>
                        {!loadingVitals && vitalSigns.length > 0 && (
                            <View style={styles.vitalsInfo}>
                                <Text style={styles.vitalsText}>
                                    Avg: {averageHeartRate} BPM • {vitalSigns.length} readings
                                </Text>
                                <Text style={styles.vitalsText}>
                                    Last updated: {new Date(vitalSigns[0].timestamp).toLocaleTimeString()}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Blood Pressure Card */}
                <View style={styles.metricCard}>
                    <View style={[styles.metricCardContent, { backgroundColor: '#9B7FD4' }]}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="pulse" size={22} color="#FFFFFF" />
                            <Text style={styles.metricTitle}>Blood Pressure</Text>
                        </View>
                        <View style={styles.moodContainer}>
                            {loadingVitals ? (
                                <ActivityIndicator color="#FFFFFF" size="large" />
                            ) : vitalSigns.length > 0 ? (
                                <>
                                    <Text style={styles.bpText}>
                                        {currentSystolic}/{currentDiastolic}
                                    </Text>
                                    <Text style={styles.bpUnit}>mmHg</Text>
                                    <View style={styles.chartContainer}>
                                        {vitalSigns.slice(0, 8).reverse().map((vital, index) => {
                                            const normalizedHeight = Math.max(10, (vital.systolicBP / 200) * 40);
                                            return (
                                                <View
                                                    key={index}
                                                    style={[styles.chartBar, { height: normalizedHeight }]}
                                                />
                                            );
                                        })}
                                    </View>
                                </>
                            ) : (
                                <Text style={styles.moodText}>No Data</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Stress Level Card - Now shows actual stress level from assessments */}
                <View style={styles.metricCard}>
                    <View style={[styles.metricCardContent, { backgroundColor: stressCategory.color }]}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="flash" size={22} color="#FFFFFF" />
                            <Text style={styles.metricTitle}>Stress Level</Text>
                        </View>
                        <View style={styles.moodContainer}>
                            {loadingAssessments ? (
                                <ActivityIndicator color="#FFFFFF" size="large" />
                            ) : assessmentResults.length > 0 ? (
                                <>
                                    <Text style={styles.stressNumber}>{currentStressLevel}/5</Text>
                                    <Text style={styles.stressLabel}>{stressCategory.label}</Text>
                                    <View style={styles.stressBarContainer}>
                                        <View style={styles.stressBar}>
                                            <View style={[
                                                styles.stressProgress,
                                                { width: `${(currentStressLevel / 5) * 100}%` }
                                            ]} />
                                        </View>
                                    </View>
                                    <Text style={styles.assessmentCount}>
                                        {assessmentResults.length} assessments
                                    </Text>
                                </>
                            ) : (
                                <Text style={styles.moodText}>No Data</Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Mood Card */}
                <View style={styles.metricCard}>
                    <View style={[styles.metricCardContent, { backgroundColor: '#E18942' }]}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="happy" size={22} color="#FFFFFF" />
                            <Text style={styles.metricTitle}>Mood</Text>
                        </View>
                        <View style={styles.moodContainer}>
                            {loadingAssessments ? (
                                <ActivityIndicator color="#FFFFFF" size="large" />
                            ) : (
                                <>
                                    <Text style={styles.moodText}>
                                        {assessmentResults.length > 0
                                            ? assessmentResults[0].mood || "Neutral"
                                            : backendAssessmentData?.mood?.label || "Neutral"
                                        }
                                    </Text>
                                    <View style={styles.chartContainer}>
                                        {/* Generate mood trend chart from recent assessments */}
                                        {assessmentResults.length > 0
                                            ? assessmentResults.slice(0, 8).reverse().map((assessment, index) => {
                                                const moodScore = assessment.severity || Math.random() * 5 + 1;
                                                return (
                                                    <View
                                                        key={index}
                                                        style={[styles.chartBar, { height: moodScore * 8 }]}
                                                    />
                                                );
                                            })
                                            : [3, 2, 5, 6, 8, 4, 2, 1].map((height, index) => (
                                                <View
                                                    key={index}
                                                    style={[styles.chartBar, { height: height * 5 }]}
                                                />
                                            ))
                                        }
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Sleep Quality Card */}
                <View style={styles.metricCard}>
                    <View style={[styles.metricCardContent, { backgroundColor: '#5D9CEC' }]}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="moon" size={22} color="#FFFFFF" />
                            <Text style={styles.metricTitle}>Sleep Quality</Text>
                        </View>
                        <View style={styles.moodContainer}>
                            {isLoading || loadingAssessments ? (
                                <ActivityIndicator color="#FFFFFF" size="large" />
                            ) : (
                                <>
                                    <Text style={[styles.moodText, { fontSize: 24, marginBottom: 5 }]}>
                                        {assessmentResults.length > 0 && assessmentResults[0].responses?.[2]
                                            ? assessmentResults[0].responses[2]
                                            : backendAssessmentData?.sleepQuality?.label || "Unknown"
                                        }
                                    </Text>
                                    <View style={styles.sleepHoursContainer}>
                                        <Text style={[styles.moodText, { fontSize: 16 }]}>
                                            {typeof backendAssessmentData?.sleepQuality?.hours === 'number' && backendAssessmentData.sleepQuality.hours < 3
                                                ? '<3h'
                                                : `${backendAssessmentData?.sleepQuality?.hours || "?"}`
                                            }
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>

            {/* Pagination Dots */}
            <View style={styles.paginationContainer}>
                {[0, 1, 2, 3, 4].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            activeMetricIndex === index && styles.activeDot
                        ]}
                    />
                ))}
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
    metricCard: {
        width: width - 40,
        marginHorizontal: 20,
        borderRadius: 15,
        overflow: 'hidden',
    },
    metricCardContent: {
        padding: 15,
        height: 150,
    },
    metricHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metricTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    scoreCircleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginTop: - 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    scoreLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    scoreBPM: {
        fontSize: 10,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    vitalsInfo: {
        position: 'absolute',
        bottom: 8,
        left: 15,
        right: 15,
    },
    vitalsText: {
        fontSize: 10,
        color: '#FFFFFF',
        textAlign: 'center',
        opacity: 0.9,
    },
    moodContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    moodText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginVertical: 10,
    },
    bpText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 0,
        marginTop: 30,
    },
    bpUnit: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.8,
        marginBottom: 10,
    },
    stressNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 0,
    },
    stressLabel: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '600',
        marginBottom: 10,
    },
    stressBarContainer: {
        width: '80%',
        marginBottom: 8,
    },
    stressBar: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    stressProgress: {
        height: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: 4,
    },
    assessmentCount: {
        fontSize: 10,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    chartContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        height: 60,
        width: '100%',
    },
    chartBar: {
        width: 5,
        backgroundColor: 'rgba(255,255,255,0.7)',
        marginHorizontal: 5,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginVertical: 15,
    },
    paginationDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
    },
    activeDot: {
        backgroundColor: '#8DAA6D',
    },
    sleepHoursContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 3,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 8,
        paddingHorizontal: 15,
    },
});

export default MentalHealthMetrics;