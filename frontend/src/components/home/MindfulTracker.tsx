import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { AssessmentData } from '@/src/store/Store';

// Helper function for sleep score calculation
const getSleepScore = (sleepQuality?: { label?: string; hours?: string | number }) => {
    if (!sleepQuality) return "?";
    // Simple scoring logic - can be enhanced
    return sleepQuality.label === "Good" ? "8" : sleepQuality.label === "Average" ? "6" : "4";
};

interface MindfulTrackerProps {
    backendAssessmentData: AssessmentData | null;
    assessmentData: AssessmentData | null;
    isLoading: boolean;
}

const MindfulTracker = ({ backendAssessmentData, assessmentData, isLoading }: MindfulTrackerProps) => {
    return (
        <>
            {/* Mindful Tracker Header */}
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Mindful Tracker</Text>
                <TouchableOpacity>
                    <Feather name="more-horizontal" size={24} color="#5D4037" />
                </TouchableOpacity>
            </View>

            {/* Mindful Hours */}
            <View style={styles.trackerCard}>
                <View style={styles.trackerIcon}>
                    <Ionicons name="time-outline" size={24} color="#8DAA6D" />
                </View>
                <View style={styles.trackerContent}>
                    <View>
                        <Text style={styles.trackerTitle}>Mindful Hours</Text>
                        <Text style={styles.trackerValue}>2.5h/8h Today</Text>
                    </View>
                    <View style={styles.trackerGraph}>
                        {/* Simplified line graph */}
                        <View style={styles.lineGraph}>
                            <View style={[styles.linePoint, { top: 20 }]} />
                            <View style={[styles.linePoint, { top: 5, left: '30%' }]} />
                            <View style={[styles.linePoint, { top: 15, left: '60%' }]} />
                            <View style={[styles.linePoint, { top: 0, left: '90%' }]} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Sleep Quality */}
            <View style={styles.trackerCard}>
                <View style={[styles.trackerIcon, { backgroundColor: '#F0E6FF' }]}>
                    <Ionicons name="moon" size={24} color="#9B7FD4" />
                </View>
                <View style={styles.trackerContent}>
                    <View>
                        <Text style={styles.trackerTitle}>Sleep Quality</Text>
                        <Text style={styles.trackerValue}>
                            {backendAssessmentData && backendAssessmentData.sleepQuality ?
                                `${backendAssessmentData.sleepQuality.label} (${backendAssessmentData.sleepQuality.hours})` :
                                "Loading..."}
                        </Text>
                    </View>
                    <View style={styles.qualityIndicator}>
                        <Text style={styles.qualityValue}>
                            {assessmentData ? getSleepScore(assessmentData.sleepQuality) : "?"}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Mindful Journal */}
            <View style={styles.trackerCard}>
                <View style={[styles.trackerIcon, { backgroundColor: '#FFEEE6' }]}>
                    <Ionicons name="journal-outline" size={24} color="#E18942" />
                </View>
                <View style={styles.trackerContent}>
                    <View>
                        <Text style={styles.trackerTitle}>Mindful Journal</Text>
                        <Text style={styles.trackerValue}>64 Day Streak</Text>
                    </View>
                    <View style={styles.habitGrid}>
                        {/* Simplified habit grid */}
                        {Array(16).fill(0).map((_, index) => (
                            <View
                                key={index}
                                style={[
                                    styles.habitCell,
                                    { backgroundColor: index < 12 ? '#E18942' : '#FFD8C2' }
                                ]}
                            />
                        ))}
                    </View>
                </View>
            </View>

            {/* Stress Level */}
            <View style={styles.trackerCard}>
                <View style={[styles.trackerIcon, { backgroundColor: '#FFFBE6' }]}>
                    <Ionicons name="flash" size={24} color="#F0CA00" />
                </View>
                <View style={styles.trackerContent}>
                    <View>
                        <Text style={styles.trackerTitle}>Stress Level</Text>
                        <Text style={styles.trackerValue}>Level 3 (Normal)</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                            <View style={[styles.progress, { width: '40%', backgroundColor: '#F0CA00' }]} />
                        </View>
                    </View>
                </View>
            </View>

            {/* Mood Tracker */}
            <View style={styles.trackerCard}>
                <View style={[styles.trackerIcon, { backgroundColor: '#FFF8E6' }]}>
                    <Ionicons name="happy" size={24} color="#8B7B73" />
                </View>
                <View style={styles.trackerContent}>
                    <View style={styles.moodProgressContainer}>
                        <Text style={styles.trackerTitle}>Mood Tracker</Text>
                        <View style={styles.moodProgress}>
                            <Text style={[styles.moodLabel, { color: '#E18942' }]}>Sad</Text>
                            <Text style={styles.moodArrow}>→</Text>
                            <Text style={[styles.moodLabel, { color: '#8DAA6D' }]}>Happy</Text>
                            <Text style={styles.moodArrow}>→</Text>
                            <Text style={[styles.moodLabel, { color: '#8B7B73' }]}>Neutral</Text>
                        </View>
                    </View>
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
    trackerCard: {
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
    trackerContent: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trackerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 4,
    },
    trackerValue: {
        fontSize: 13,
        color: '#8B7B73',
    },
    trackerGraph: {
        width: 90,
        height: 40,
        justifyContent: 'center',
    },
    lineGraph: {
        position: 'relative',
        height: 30,
    },
    linePoint: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#8DAA6D',
    },
    qualityIndicator: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#9B7FD4',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qualityValue: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    habitGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 80,
    },
    habitCell: {
        width: 16,
        height: 16,
        margin: 2,
        borderRadius: 3,
    },
    progressBarContainer: {
        width: 120,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progress: {
        height: '100%',
    },
    moodProgressContainer: {
        flex: 1,
    },
    moodProgress: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    moodLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    moodArrow: {
        marginHorizontal: 4,
        color: '#8B7B73',
        fontSize: 13,
    },
});

export default MindfulTracker;