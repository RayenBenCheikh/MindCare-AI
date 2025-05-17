import React, { useEffect, useState, useContext } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, Image, TextInput, TouchableOpacity, StatusBar, Dimensions,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { colors, images } from '@/src/theme';
import { AuthContext } from '@/src/context/AuthContext';
import MindfulTracker from '@/src/components/home/MindfulTracker';
import MentalHealthMetrics from '@/src/components/home/MentalHealthMetrics';
//import AIChatbot from '../../components/home/AIChatbot';
import MindfulResources from '@/src/components/home/MindfulResources';
import axios from 'axios';
import { AssessmentData, useAssessmentStore } from '@/src/store/Store';
import { API_ENDPOINTS } from '@/src/constants/const';
import { useNavigation } from '@react-navigation/native';
import { api, setAuthToken } from '@/src/api/config';
import { isTokenExpired } from '@/src/api/config';
import AIChatbot from '@/src/components/home/AIChatBot';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
type NavigationProp = NativeStackNavigationProp<HomeStackParamList>;
const Home = () => {
    const [currentDateTime, setCurrentDateTime] = useState('');
    const [backendAssessmentData, setBackendAssessmentData] = useState<AssessmentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { userData, userToken } = useContext(AuthContext);
    const navigation = useNavigation<NavigationProp>();
    const { signOut } = useContext(AuthContext);
    // Extract the user's name or use a fallback
    const username = userData?.name || userData?.username || userData?.email?.split('@')[0] || "User";

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

    // Fetch assessment data from API
    useEffect(() => {
        const fetchAssessmentData = async () => {
            if (!userToken) return;

            // Check if token is expired
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
                    // This sets the data directly from the backend response
                    setBackendAssessmentData(response.data.assessment);

                    // Log the mood and sleep data to verify
                    console.log('Mood data:', response.data.assessment.mood);
                    console.log('Sleep data:', response.data.assessment.sleepQuality);
                }
            } catch (error) {
                console.error('Error fetching assessment data:', error);
                if (axios.isAxiosError(error)) {
                    console.error('Response status:', error.response?.status);
                    console.error('Response data:', error.response?.data);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchAssessmentData();
    }, [userToken]);

    const handleChatPress = () => {
        // Navigate to chat screen
        navigation.navigate('Chatbot');
        console.log('Chat button pressed');
    };

    const handleSeeAllResources = () => {
        // Navigate to resources screen
        console.log('See all resources button pressed');
        navigation.navigate('Chatbot');
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
                {/* Mental Health Metrics Component */}
                <MentalHealthMetrics
                    backendAssessmentData={backendAssessmentData}
                    isLoading={isLoading}
                />

                {/* Mindful Tracker Component */}
                <MindfulTracker
                    backendAssessmentData={backendAssessmentData}
                    assessmentData={backendAssessmentData}
                    isLoading={isLoading}
                />

                {/* AI Therapy Chatbot Component */}
                <AIChatbot
                    onChatPress={handleChatPress}
                    onSettingsPress={() => { }}
                />

                {/* Mindful Resources Component */}
                <MindfulResources
                    onSeeAllPress={handleSeeAllResources}
                />

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
});

export default Home;