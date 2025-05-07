import React, { useEffect, useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
    TextInput,
    TouchableOpacity,
    StatusBar,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, images } from '@/src/theme';
import { AuthContext } from '@/src/context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS } from '@/src/api/config';
import axios from 'axios';
// Get screen dimensions
const { width } = Dimensions.get('window');

// Define the structure of the assessment data
interface AssessmentData {
    mood?: {
        label?: string;
    };
    // Add other properties as needed
}

const Home = () => {
    const [activeMetricIndex, setActiveMetricIndex] = useState(0);
    const [activeResourceIndex, setActiveResourceIndex] = useState(0);
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // Get the user data from authentication context
    const { userData, userToken } = useContext(AuthContext);

    // Extract the user's name or use a fallback
    const username = userData?.name || userData?.username || userData?.email?.split('@')[0] || "User";

    // Update the time every minute
    useEffect(() => {
        // Function to update the current date and time
        const updateDateTime = () => {
            const now = new Date();

            // Format the date and time: "Weekday, HH:MM AM/PM"
            const formattedDateTime = format(now, "EEE, h:mm a");
            setCurrentDateTime(formattedDateTime);
        };

        // Update immediately
        updateDateTime();

        // Set up interval to update every minute
        const intervalId = setInterval(updateDateTime, 60000);

        // Clean up the interval on component unmount
        return () => clearInterval(intervalId);
    }, []
    );
    useEffect(() => {
        const fetchAssessmentData = async () => {
            if (!userToken) return;

            try {
                const response = await axios.get(
                    `${API_BASE_URL}/api/assessments/latest`,
                    {
                        headers: {
                            Authorization: `Bearer ${userToken}`
                        }
                    }
                );

                if (response.data.success && response.data.assessment) {
                    console.log('Assessment data fetched:', response.data.assessment);
                    setAssessmentData(response.data.assessment);
                }
            } catch (error) {
                console.error('Error fetching assessment data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessmentData();
    }, [userToken]);
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#483524" />

            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={18} color="#E8DDD9" />
                    <Text style={styles.dateText}>{currentDateTime}</Text>
                </View>

                <TouchableOpacity style={styles.notificationButton}>
                    <Ionicons name="notifications" size={22} color="#E8DDD9" />
                    <View style={styles.notificationBadge} />
                </TouchableOpacity>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.profileContainer}>
                    <Image
                        source={
                            typeof userData?.profileImage === 'string' && userData?.profileImage
                                ? { uri: userData.profileImage }
                                : images.Professional // Use a local fallback image
                        }
                        style={styles.profileImage}
                    />
                    <View>
                        <Text style={styles.greeting}>Hi, {username}!</Text>
                    </View>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search anything..."
                    placeholderTextColor="#8B7B73"
                />
                <TouchableOpacity style={styles.searchButton}>
                    <Ionicons name="search" size={22} color="#5D4037" />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
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
                                            {assessmentData?.mood?.label || "Neutral"}
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

                {/* Mindful Tracker */}
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
                            <Text style={styles.trackerValue}>Insomniac (~2h Avg)</Text>
                        </View>
                        <View style={styles.qualityIndicator}>
                            <Text style={styles.qualityValue}>20</Text>
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

                {/* AI Therapy Chatbot */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>AI Therapy Chatbot</Text>
                    <TouchableOpacity>
                        <Ionicons name="settings-outline" size={24} color="#5D4037" />
                    </TouchableOpacity>
                </View>

                <View style={styles.chatbotCard}>
                    <View style={styles.chatbotContent}>
                        <View>
                            <Text style={styles.chatbotNumber}>2,541</Text>
                            <Text style={styles.chatbotLabel}>Conversations</Text>
                            <Text style={styles.chatbotSubtext}>83 left this month</Text>
                            <View style={styles.chatbotPromo}>
                                <Ionicons name="star" size={14} color="#FFFFFF" />
                                <Text style={styles.promoText}>Go Pro. Now!</Text>
                            </View>
                        </View>
                        <View style={styles.chatbotImageContainer}>
                            <MaterialCommunityIcons name="robot" size={60} color="#CCCCCC" />
                            <View style={styles.chatbotBubble}>
                                <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
                            </View>
                        </View>
                    </View>
                    <View style={styles.chatbotActions}>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#8DAA6D' }]}>
                            <Ionicons name="add" size={24} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#E18942' }]}>
                            <Ionicons name="settings-sharp" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Mindful Resources */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Mindful Resources</Text>
                    <TouchableOpacity>
                        <Text style={styles.seeAllLink}>See All</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    onScroll={(event) => {
                        const contentOffsetX = event.nativeEvent.contentOffset.x;
                        const newIndex = Math.round(contentOffsetX / width);
                        setActiveResourceIndex(newIndex);
                    }}
                    scrollEventThrottle={16}
                >
                    {[1, 2].map((num) => (
                        <View key={num} style={styles.resourceCard}>
                            <Image
                                source={{ uri: 'https://images.unsplash.com/photo-1454944338482-a69bb95894af' }}
                                style={styles.resourceImage}
                            />
                            <View style={styles.resourceContent}>
                                <Text style={styles.resourceCategory}>Mental Health</Text>
                                <Text style={styles.resourceTitle}>
                                    Will meditation help you get out from the rat race?
                                </Text>
                                <View style={styles.resourceStats}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="eye-outline" size={14} color="#8B7B73" />
                                        <Text style={styles.statText}>5,241</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Ionicons name="heart-outline" size={14} color="#8B7B73" />
                                        <Text style={styles.statText}>987</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Ionicons name="chatbubble-outline" size={14} color="#8B7B73" />
                                        <Text style={styles.statText}>22</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ))}
                </ScrollView>

                {/* Resource Pagination */}
                <View style={styles.resourcePaginationContainer}>
                    {[0, 1, 2, 3].map((index) => (
                        <View
                            key={index}
                            style={[
                                styles.paginationDot,
                                activeResourceIndex === index && styles.activeDot
                            ]}
                        />
                    ))}
                </View>


                {/* Bottom spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>

            <View style={styles.tabBarContainer}>
                <View style={styles.floatingButtonWrapper}>
                    <TouchableOpacity style={styles.floatingButton}>
                        <Ionicons name="add" size={32} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                <View style={styles.pillTabBar}>
                    <TouchableOpacity style={styles.tabItem}>
                        <View style={styles.tabIconContainer}>
                            <Ionicons name="home" size={24} color="#5D4037" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tabItem}>
                        <View style={styles.tabIconContainer}>
                            <Ionicons name="chatbubble-ellipses-outline" size={24} color="#AAAAAA" />
                        </View>
                    </TouchableOpacity>

                    {/* Empty space for center button */}
                    <View style={styles.tabItem} />

                    <TouchableOpacity style={styles.tabItem}>
                        <View style={styles.tabIconContainer}>
                            <Ionicons name="stats-chart" size={24} color="#AAAAAA" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.tabItem}>
                        <View style={styles.tabIconContainer}>
                            <Ionicons name="person-outline" size={24} color="#AAAAAA" />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.marron,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        color: '#E8DDD9',
        marginLeft: 4,
        fontSize: 14,
    },
    notificationButton: {
        position: 'relative',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#E18942',
    },
    profileSection: {
        paddingHorizontal: 20,
        marginTop: 10,
        marginBottom: 15,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 12,
    },
    greeting: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
    },
    badgeText: {
        color: '#E8DDD9',
        fontSize: 13,
        marginLeft: 2,
    },
    searchContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginBottom: 20,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#5D4037',
    },
    searchButton: {
        padding: 5,
    },
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
        paddingBottom: 100,
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
    seeAllLink: {
        fontSize: 14,
        color: '#8DAA6D',
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
    chatbotCard: {
        marginHorizontal: 20,
        borderRadius: 15,
        backgroundColor: '#808080',
        overflow: 'hidden',
        marginBottom: 20,
    },
    chatbotContent: {
        flexDirection: 'row',
        padding: 15,
        justifyContent: 'space-between',
    },
    chatbotNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    chatbotLabel: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 8,
    },
    chatbotSubtext: {
        fontSize: 13,
        color: '#E8E8E8',
        marginBottom: 8,
    },
    chatbotPromo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    promoText: {
        color: '#FFFFFF',
        fontSize: 12,
        marginLeft: 4,
    },
    chatbotImageContainer: {
        position: 'relative',
    },
    chatbotBubble: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#8DAA6D',
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chatbotActions: {
        flexDirection: 'row',
        justifyContent: 'center',
        padding: 10,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 10,
    },
    resourceCard: {
        width: width - 40,
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    resourceImage: {
        width: '100%',
        height: 120,
        backgroundColor: '#F0F0F0',
    },
    resourceContent: {
        padding: 15,
    },
    resourceCategory: {
        fontSize: 13,
        color: '#8B7B73',
        marginBottom: 4,
    },
    resourceTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        marginBottom: 10,
    },
    resourceStats: {
        flexDirection: 'row',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 15,
    },
    statText: {
        fontSize: 12,
        color: '#8B7B73',
        marginLeft: 3,
    },
    resourcePaginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 15,
    },
    tabBarContainer: {
        position: 'static',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 999,
        width: '100%',
        backgroundColor: colors.white
    },

    pillTabBar: {
        flexDirection: 'row',
        backgroundColor: 'white',
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        width: '100%',
        alignItems: 'center',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIconContainer: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingButtonWrapper: {
        position: 'absolute',
        alignItems: 'center',
        bottom: 20,
        zIndex: 1000,
        elevation: 10,
    },
    floatingButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#8DAA6D',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 10,
    },
});

export default Home;