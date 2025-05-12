import React, { useState } from 'react';
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

// Get screen dimensions
const { width } = Dimensions.get('window');

interface MentalHealthMetricsProps {
    backendAssessmentData: AssessmentData | null;
    isLoading: boolean;
}

const MentalHealthMetrics = ({ backendAssessmentData, isLoading }: MentalHealthMetricsProps) => {
    const [activeMetricIndex, setActiveMetricIndex] = useState(0);

    return (
        <>
            {/* Mental Health Metrics */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mental Health Metrics</Text>
                <TouchableOpacity>
                    <Feather name="more-horizontal" size={24} color="#5D4037" />
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
                {/*  Score Card */}
                <View style={styles.metricCard}>
                    <View style={[styles.metricCardContent, { backgroundColor: '#8DAA6D' }]}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="heart" size={22} color="#FFFFFF" />
                            <Text style={styles.metricTitle}> Score</Text>
                        </View>
                        <View style={styles.scoreCircleContainer}>
                            <View style={styles.scoreCircle}>
                                <Text style={styles.scoreNumber}>80</Text>
                                <Text style={styles.scoreLabel}>Healthy</Text>
                            </View>
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
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="large" />
                            ) : (
                                <>
                                    <Text style={styles.moodText}>
                                        {backendAssessmentData?.mood?.label || "Neutral"}
                                    </Text>
                                    <View style={styles.chartContainer}>
                                        {/* You could generate dynamic bars based on mood rating */}
                                        {[3, 2, 5, 6, 8, 4, 2, 1].map((height, index) => (
                                            <View
                                                key={index}
                                                style={[styles.chartBar, { height: height * 5 }]}
                                            />
                                        ))}
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Sleep Quality Card */}
                <View style={styles.metricCard}>
                    <View style={[styles.metricCardContent, { backgroundColor: '#9B7FD4' }]}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="moon" size={22} color="#FFFFFF" />
                            <Text style={styles.metricTitle}>Sleep Quality</Text>
                        </View>
                        <View style={styles.moodContainer}>
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="large" />
                            ) : (
                                <>
                                    <Text style={[styles.moodText, { fontSize: 30, marginBottom: 0 }]}>
                                        {backendAssessmentData?.sleepQuality?.label || "Worst"}
                                    </Text>
                                    <View style={styles.sleepHoursContainer}>
                                        <Text style={[styles.moodText, { fontSize: 20 }]}>
                                            {typeof backendAssessmentData?.sleepQuality?.hours === 'number' && backendAssessmentData.sleepQuality.hours < 3
                                                ? '<3'
                                                : backendAssessmentData?.sleepQuality?.hours || "?"}
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Health Goal Card */}
                <View style={styles.metricCard}>
                    <View style={[styles.metricCardContent, { backgroundColor: '#5D9CEC' }]}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="flag" size={22} color="#FFFFFF" />
                            <Text style={styles.metricTitle}>Health Goal</Text>
                        </View>
                        <View style={[styles.moodContainer, { justifyContent: 'center' }]}>
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="large" />
                            ) : (
                                <Text style={[styles.moodText, { fontSize: 22, textAlign: 'center' }]}>
                                    {backendAssessmentData?.healthGoal?.text || "No goal set"}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* Professional Help Card */}
                <View style={styles.metricCard}>
                    <View style={[styles.metricCardContent, { backgroundColor: '#FF7A90' }]}>
                        <View style={styles.metricHeader}>
                            <Ionicons name="medkit" size={22} color="#FFFFFF" />
                            <Text style={styles.metricTitle}>Professional Help</Text>
                        </View>
                        <View style={[styles.moodContainer, { justifyContent: 'center' }]}>
                            {isLoading ? (
                                <ActivityIndicator color="#FFFFFF" size="large" />
                            ) : (
                                <>
                                    <Text style={[styles.moodText, { fontSize: 26, textAlign: 'center', marginBottom: 5 }]}>
                                        {backendAssessmentData?.professionalHelp === "yes" ?
                                            "Yes" :
                                            backendAssessmentData?.professionalHelp === "no" ?
                                                "No" :
                                                "Not specified"}
                                    </Text>
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
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderWidth: 4,
        borderColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scoreNumber: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    moodContainer: {
        flex: 1,
        alignItems: 'center',
    },
    moodText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginVertical: 10,
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
        paddingVertical: 5,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
        paddingHorizontal: 25,
    },
});

export default MentalHealthMetrics;