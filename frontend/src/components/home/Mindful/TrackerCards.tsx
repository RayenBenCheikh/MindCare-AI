import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import {
    MindfulTrackerData,
    getDetailedSleepDisplay,
    getTodayAssessmentCount,
    getStreakDetails,
    getStressLevelLabel,
    getStressLevelColor,
    getMoodIcon,
    formatMoodLabel,
    getMoodEmoji
} from '@/src/constants/HelperMindful'

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

interface TrackerCardsProps {
    trackerData: MindfulTrackerData | null;
}

const TrackerCards: React.FC<TrackerCardsProps> = ({ trackerData }) => {
    const navigation = useNavigation<NavigationProp>();

    return (
        <>
            {/* Mindful Hours */}
            <TouchableOpacity
                style={styles.trackerCard}
                onPress={() => navigation.navigate('MindfulHours')}
                activeOpacity={0.7}
            >
                <View style={styles.trackerIcon}>
                    <Ionicons name="time-outline" size={24} color="#8DAA6D" />
                </View>
                <View style={styles.trackerContent}>
                    <View style={styles.cardMainContent}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.trackerTitle}>Mindful Hours</Text>
                            <Ionicons name="chevron-forward" size={16} color="#8B7B73" />
                        </View>
                        <Text style={styles.trackerValue}>
                            {trackerData ? `${trackerData.mindfulHours.toFixed(1)}h/8h Today` : '0h/8h Today'}
                        </Text>
                        <Text style={styles.viewAllHint}>
                            Tap to view session history →
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Sleep Quality */}
            <TouchableOpacity
                style={styles.trackerCard}
                onPress={() => navigation.navigate('SleepQuality')}
                activeOpacity={0.7}
            >
                <View style={[styles.trackerIcon, { backgroundColor: '#F0E6FF' }]}>
                    <Ionicons name="moon" size={24} color="#9B7FD4" />
                </View>
                <View style={styles.trackerContent}>
                    <View style={styles.cardMainContent}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.trackerTitle}>Sleep Quality</Text>
                            <Ionicons name="chevron-forward" size={16} color="#8B7B73" />
                        </View>
                        <Text style={styles.trackerValue}>
                            {trackerData?.sleepQuality || 'No data'}
                        </Text>
                        <Text style={styles.viewAllHint}>
                            Tap to view sleep history →
                        </Text>
                    </View>
                    <View style={styles.qualityIndicator}>
                        <Text style={styles.qualityValue}>
                            {trackerData ? getDetailedSleepDisplay(trackerData.sleepQuality, trackerData.assessments).display : "?"}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Assessment Streak */}
            <TouchableOpacity
                style={styles.trackerCard}
                onPress={() => navigation.navigate('AssessmentHistory')}
                activeOpacity={0.7}
            >
                <View style={[styles.trackerIcon, { backgroundColor: '#FFEEE6' }]}>
                    <Ionicons name="journal-outline" size={24} color="#E18942" />
                </View>
                <View style={styles.trackerContent}>
                    <View style={styles.streakInfoContainer}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.trackerTitle}>Assessment Streak</Text>
                            <Ionicons name="chevron-forward" size={16} color="#8B7B73" />
                        </View>
                        <Text style={styles.trackerValue}>
                            {trackerData ? `${trackerData.journalStreak} Day Streak` : '0 Day Streak'}
                        </Text>
                        {trackerData && (
                            <Text style={styles.viewAllHint}>
                                Today: {getTodayAssessmentCount(trackerData.assessments)} • Tap to view all →
                            </Text>
                        )}
                    </View>
                    <View style={styles.miniHabitGrid}>
                        {trackerData ?
                            getStreakDetails(trackerData.assessments).streakData.map((hasAssessment, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.miniHabitCell,
                                        {
                                            backgroundColor: hasAssessment ? '#E18942' : '#FFD8C2',
                                            opacity: hasAssessment ? 1 : 0.5,
                                        }
                                    ]}
                                />
                            )) :
                            Array(7).fill(0).map((_, index) => (
                                <View
                                    key={index}
                                    style={[styles.miniHabitCell, { backgroundColor: '#FFD8C2', opacity: 0.5 }]}
                                />
                            ))
                        }
                    </View>
                </View>
            </TouchableOpacity>

            {/* Stress Level */}
            <TouchableOpacity
                style={styles.trackerCard}
                onPress={() => navigation.navigate('StressLevel')}
                activeOpacity={0.7}
            >
                <View style={[styles.trackerIcon, { backgroundColor: '#FFFBE6' }]}>
                    <Ionicons name="flash" size={24} color="#F0CA00" />
                </View>
                <View style={styles.trackerContent}>
                    <View style={styles.cardMainContent}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.trackerTitle}>Stress Level</Text>
                            <Ionicons name="chevron-forward" size={16} color="#8B7B73" />
                        </View>
                        <Text style={styles.trackerValue}>
                            {trackerData
                                ? `Level ${trackerData.averageStressLevel.toFixed(1)} (${getStressLevelLabel(trackerData.averageStressLevel)})`
                                : 'No data'
                            }
                        </Text>
                        <Text style={styles.viewAllHint}>
                            Tap to view stress trends →
                        </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                            <View style={[
                                styles.progress,
                                {
                                    width: `${(trackerData?.averageStressLevel || 0) * 20}%`,
                                    backgroundColor: getStressLevelColor(trackerData?.averageStressLevel || 0)
                                }
                            ]} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>

            {/* Current Mood */}
            <TouchableOpacity
                style={styles.trackerCard}
                onPress={() => navigation.navigate('MoodTracker')}
                activeOpacity={0.7}
            >
                <View style={[styles.trackerIcon, { backgroundColor: '#FFF8E6' }]}>
                    <Ionicons
                        name={getMoodIcon(trackerData?.currentMood || 'neutral')}
                        size={24}
                        color="#8B7B73"
                    />
                </View>
                <View style={styles.trackerContent}>
                    <View style={styles.cardMainContent}>
                        <View style={styles.cardHeaderRow}>
                            <Text style={styles.trackerTitle}>Current Mood</Text>
                            <Ionicons name="chevron-forward" size={16} color="#8B7B73" />
                        </View>
                        <Text style={styles.trackerValue}>
                            {formatMoodLabel(trackerData?.currentMood || 'neutral')}
                        </Text>
                        <Text style={styles.viewAllHint}>
                            Tap to view mood history →
                        </Text>
                    </View>
                    <View style={styles.moodEmojiContainer}>
                        <Text style={styles.moodEmoji}>
                            {getMoodEmoji(trackerData?.currentMood || 'neutral')}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </>
    );
};

const styles = StyleSheet.create({
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
    cardMainContent: {
        flex: 1,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    trackerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
    },
    trackerValue: {
        fontSize: 13,
        color: '#8B7B73',
        marginBottom: 2,
    },
    viewAllHint: {
        fontSize: 9,
        color: '#E18942',
        fontStyle: 'italic',
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
    streakInfoContainer: {
        flex: 1,
    },
    miniHabitGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: 60,
        justifyContent: 'flex-end',
    },
    miniHabitCell: {
        width: 6,
        height: 6,
        margin: 1,
        borderRadius: 1,
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
    moodEmojiContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 40,
    },
    moodEmoji: {
        fontSize: 28,
    },
});

export default TrackerCards;