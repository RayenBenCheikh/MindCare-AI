import React, { useEffect, useState, useContext, useRef } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TextInput, TouchableOpacity, StatusBar,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, images } from '@/src/theme';
import { AuthContext } from '@/src/context/AuthContext';
import axios from 'axios';
import { AssessmentData } from '@/src/store/Store';
import { API_ENDPOINTS } from '@/src/constants/const';
import { useNavigation } from '@react-navigation/native';
import { api, setAuthToken } from '@/src/api/config';
import { isTokenExpired } from '@/src/api/config';

import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import NotificationService from '@/src/service/NotificationService';
import MindfulTracker from '@/src/components/home/Mindful/MindfulTracker';
import MentalHealthMetrics from '@/src/components/home/MentalHealthMetrics';
import MindfulResources from '@/src/components/home/Mindful/MindfulResources';
import AIChatbot from '@/src/components/home/chat/AIChatBot';
import MindfulMusic from '@/src/components/home/Mindful/MindfulMusic';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;

const Home = () => {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [backendAssessmentData, setBackendAssessmentData] = useState<AssessmentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { userData, userToken } = useContext(AuthContext);
    const navigation = useNavigation<NavigationProp>();
    const { signOut } = useContext(AuthContext);
    const [refreshKey, setRefreshKey] = useState(0);
    const [hasNotifications, setHasNotifications] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    // ✅ Refs for scrolling to sections
    const scrollViewRef = useRef<ScrollView>(null);
    const metricsRef = useRef<View>(null);
    const trackerRef = useRef<View>(null);
    const chatbotRef = useRef<View>(null);
    const resourcesRef = useRef<View>(null);
    const musicRef = useRef<View>(null);

    const username = userData?.name || userData?.username || userData?.email?.split('@')[0] || "User";

    const handleRefreshTracker = () => {
        setRefreshKey(prev => prev + 1);
    };

    // ✅ Enhanced search with scroll positions
    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (query.trim().length === 0) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        if (query.trim().length < 2) {
            return;
        }

        setIsSearching(true);

        try {
            console.log('🔍 Searching for:', query);

            const searchableItems = [
                { title: 'Mental Health Metrics', section: 'metrics', keywords: ['mental', 'health', 'metrics', 'heart', 'rate', 'blood', 'pressure', 'stress'] },
                { title: 'Heart Rate', section: 'metrics', keywords: ['heart', 'rate', 'hr', 'bpm', 'cardiac'] },
                { title: 'Blood Pressure', section: 'metrics', keywords: ['blood', 'pressure', 'bp', 'systolic', 'diastolic'] },
                { title: 'Stress Level', section: 'metrics', keywords: ['stress', 'level', 'anxiety'] },
                { title: 'Mindful Tracker', section: 'tracker', keywords: ['mindful', 'tracker', 'tracking'] },
                { title: 'Sleep Quality', section: 'tracker', keywords: ['sleep', 'quality', 'rest', 'insomnia'] },
                { title: 'Mindful Hours', section: 'tracker', keywords: ['mindful', 'hours', 'meditation', 'time'] },
                { title: 'Assessment Streak', section: 'tracker', keywords: ['assessment', 'streak', 'daily', 'progress'] },
                { title: 'AI Chatbot', section: 'chatbot', keywords: ['ai', 'chat', 'chatbot', 'therapy', 'talk', 'conversation'] },
                { title: 'Therapy', section: 'chatbot', keywords: ['therapy', 'therapist', 'counseling'] },
                { title: 'Music & Meditation', section: 'music', keywords: ['music', 'meditation', 'sound', 'relax', 'calm'] },
                { title: 'Resources & Articles', section: 'resources', keywords: ['resources', 'articles', 'read', 'learn'] },
                { title: 'Notifications', section: 'notifications', keywords: ['notification', 'alert', 'reminder'] },
                { title: 'Profile', section: 'profile', keywords: ['profile', 'account', 'settings'] },
                { title: 'Statistics', section: 'statistics', keywords: ['statistics', 'stats', 'dashboard', 'analytics'] },
            ];

            const lowerQuery = query.toLowerCase();
            const filteredItems = searchableItems.filter(item =>
                item.title.toLowerCase().includes(lowerQuery) ||
                item.keywords.some(keyword => keyword.includes(lowerQuery))
            );

            const results = filteredItems.map((item, index) => ({
                id: `item_${index}`,
                title: item.title,
                section: item.section,
                type: 'category',
                action: () => handleSearchResultPress(item.section, item.title)
            }));

            setSearchResults(results);
            console.log(`✅ Found ${results.length} results`);

        } catch (error) {
            console.error('❌ Search error:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    // ✅ Handle search result with scrolling
    const handleSearchResultPress = (section: string, title: string) => {
        console.log('📍 Navigating to section:', section, title);
        setSearchQuery('');
        setSearchResults([]);

        switch (section) {
            case 'metrics':
                // Scroll to Mental Health Metrics
                metricsRef.current?.measureLayout(
                    scrollViewRef.current as any,
                    (x, y) => {
                        scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
                    },
                    () => console.log('Failed to measure metrics layout')
                );
                break;

            case 'tracker':
                // Scroll to Mindful Tracker
                trackerRef.current?.measureLayout(
                    scrollViewRef.current as any,
                    (x, y) => {
                        scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
                    },
                    () => console.log('Failed to measure tracker layout')
                );
                break;

            case 'chatbot':
                // Navigate to Chatbot or scroll to AI section
                if (title.toLowerCase().includes('ai') || title.toLowerCase().includes('chat')) {
                    handleChatPress();
                } else {
                    chatbotRef.current?.measureLayout(
                        scrollViewRef.current as any,
                        (x, y) => {
                            scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
                        },
                        () => console.log('Failed to measure chatbot layout')
                    );
                }
                break;

            case 'resources':
                // Navigate to Articles or scroll to resources
                navigation.navigate('ArticleSelection' as any);
                break;

            case 'music':
                // Scroll to Music section
                musicRef.current?.measureLayout(
                    scrollViewRef.current as any,
                    (x, y) => {
                        scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
                    },
                    () => console.log('Failed to measure music layout')
                );
                break;

            case 'notifications':
                navigation.navigate('Notifications' as any);
                break;

            case 'profile':
                navigation.navigate('Profile' as any);
                break;

            case 'statistics':
                navigation.navigate('Statistic' as any);
                break;

            default:
                Alert.alert('Info', `Navigating to ${title}`);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        setIsSearching(false);
    };

    // Update the time every minute
    useEffect(() => {
        const updateDateTime = () => {
            const now = new Date();
            const formattedDateTime = format(now, "EEE, h:mm a");
            setCurrentDateTime(formattedDateTime);
        };

        updateDateTime();
        const intervalId = setInterval(updateDateTime, 60000);
        return () => clearInterval(intervalId);
    }, []);

    const fetchNotifications = async () => {
        if (!userToken) {
            console.log('⚠️ No user token available for notifications');
            return;
        }

        try {
            const notificationService = NotificationService.getInstance();
            const { notifications, unreadCount } = await notificationService.getNotifications(userToken);

            setNotificationCount(unreadCount);
            setHasNotifications(unreadCount > 0);

            console.log(`📱 Loaded ${notifications.length} notifications, ${unreadCount} unread`);
        } catch (error) {
            console.error('❌ Error in fetchNotifications:', error);
        }
    };

    // Fetch assessment data from API
    useEffect(() => {
        const fetchAssessmentData = async () => {
            if (!userToken) return;

            if (isTokenExpired(userToken)) {
                console.log('Token has expired, redirecting to login');
                Alert.alert(
                    'Session Expired',
                    'Your session has expired. Please log in again.',
                    [{ text: 'OK', onPress: () => signOut() }]
                );
                return;
            }

            setIsLoading(true);
            setAuthToken(userToken);

            try {
                console.log('Making request to:', API_ENDPOINTS.assessments.latest);
                const response = await api.get(API_ENDPOINTS.assessments.latest);
                console.log('Assessment API response:', response.data);

                if (response.data.success && response.data.assessment) {
                    setBackendAssessmentData(response.data.assessment);
                }
            } catch (error) {
                console.error('Error fetching assessment data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAssessmentData();
    }, [userToken]);

    useEffect(() => {
        if (!userToken) {
            console.log('⚠️ Skipping notification fetch - no token');
            return;
        }

        fetchNotifications();

        const notificationInterval = setInterval(() => {
            console.log('🔄 Auto-refreshing notifications...');
            fetchNotifications();
        }, 5 * 60 * 1000);

        return () => {
            console.log('🧹 Cleaning up notification interval');
            clearInterval(notificationInterval);
        };
    }, [userToken]);

    const handleChatPress = () => {
        navigation.navigate({
            name: 'Chatbot',
            params: {}
        });
        console.log('Chat button pressed');
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#483524" />

            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.dateContainer}>
                    <Ionicons name="calendar-outline" size={18} color="#E8DDD9" />
                    <Text style={styles.dateText}>{currentDateTime}</Text>
                </View>

                <TouchableOpacity
                    style={styles.notificationButton}
                    onPress={() => navigation.navigate('Notifications' as any)}
                >
                    <Ionicons name="notifications" size={22} color="#E8DDD9" />
                    {hasNotifications && (
                        <View style={styles.notificationBadge}>
                            <Text style={styles.notificationCount}>
                                {notificationCount > 9 ? '9+' : notificationCount.toString()}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Profile Section */}
            <View style={styles.profileSection}>
                <View style={styles.profileContainer}>
                    <Image
                        source={
                            typeof userData?.profileImage === 'string' && userData?.profileImage
                                ? { uri: userData.profileImage }
                                : images.Professional
                        }
                        style={styles.profileImage}
                    />
                    <View>
                        <Text style={styles.greeting}>Hi, {username}!</Text>
                    </View>
                </View>
            </View>

            {/* ✅ Enhanced Search Bar */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search anything..."
                    placeholderTextColor="#8B7B73"
                    value={searchQuery}
                    onChangeText={handleSearch}
                    returnKeyType="search"
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                <TouchableOpacity
                    style={styles.searchButton}
                    onPress={() => searchQuery ? handleClearSearch() : null}
                >
                    <Ionicons
                        name={searchQuery ? "close-circle" : "search"}
                        size={22}
                        color="#5D4037"
                    />
                </TouchableOpacity>
            </View>

            {/* ✅ Search Results Overlay */}
            {searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                    <ScrollView
                        style={styles.searchResultsList}
                        keyboardShouldPersistTaps="handled"
                    >
                        {isSearching ? (
                            <View style={styles.searchLoadingContainer}>
                                <Text style={styles.searchLoadingText}>Searching...</Text>
                            </View>
                        ) : (
                            searchResults.map((result) => (
                                <TouchableOpacity
                                    key={result.id}
                                    style={styles.searchResultItem}
                                    onPress={result.action}
                                >
                                    <Ionicons name="search" size={18} color="#8B7B73" />
                                    <Text style={styles.searchResultText}>{result.title}</Text>
                                    <Ionicons name="arrow-forward" size={18} color="#8B7B73" />
                                </TouchableOpacity>
                            ))
                        )}
                    </ScrollView>
                </View>
            )}

            <ScrollView
                ref={scrollViewRef}
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* ✅ Mental Health Metrics with ref */}
                <View ref={metricsRef} collapsable={false}>
                    <MentalHealthMetrics
                        backendAssessmentData={backendAssessmentData}
                        isLoading={isLoading}
                    />
                </View>

                {/* ✅ Mindful Tracker with ref */}
                <View ref={trackerRef} collapsable={false}>
                    <MindfulTracker
                        key={refreshKey}
                        backendAssessmentData={backendAssessmentData}
                        assessmentData={backendAssessmentData}
                        isLoading={isLoading}
                        onRefresh={handleRefreshTracker}
                    />
                </View>

                {/* ✅ AI Therapy Chatbot with ref */}
                <View ref={chatbotRef} collapsable={false}>
                    <AIChatbot
                        onChatPress={handleChatPress}
                        onSettingsPress={() => { }}
                    />
                </View>

                {/* ✅ Mindful Resources with ref */}
                <View ref={resourcesRef} collapsable={false}>
                    <MindfulResources />
                </View>

                {/* ✅ Mindful Music with ref */}
                <View ref={musicRef} collapsable={false}>
                    <MindfulMusic />
                </View>

                {/* Bottom spacing */}
                <View style={{ height: 100 }} />
            </ScrollView>
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
        top: 5,
        right: 5,
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#E18942',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 3,
    },
    searchContainer: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 15,
        alignItems: 'center',
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    searchInput: {
        flex: 1,
        height: 45,
        fontSize: 16,
        color: '#5D4037',
    },
    searchButton: {
        padding: 5,
    },
    searchResultsContainer: {
        marginHorizontal: 20,
        marginTop: -10,
        marginBottom: 10,
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        maxHeight: 300,
        zIndex: 1000,
    },
    searchResultsList: {
        maxHeight: 300,
    },
    searchResultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    searchResultText: {
        flex: 1,
        fontSize: 15,
        color: '#5D4037',
        marginLeft: 12,
    },
    searchLoadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    searchLoadingText: {
        fontSize: 14,
        color: '#8B7B73',
    },
    notificationCount: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'center',
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
    content: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingTop: 20,
        paddingBottom: 100,
    },
});

export default Home;