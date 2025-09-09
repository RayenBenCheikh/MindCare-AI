import { useContext, useEffect, useRef, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
    Dimensions, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors } from '@/src/theme';
import { api, VITAL_SIGNS_URL, } from '@/src/api/config';
import { AuthContext } from '@/src/context/AuthContext';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
import { StackNavigationProp } from '@react-navigation/stack';

let messageCounter = 0;

interface EmotionData {
    detected_emotion: string;
    emotion_confidence: number;
}

interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
    emotion?: EmotionData;
}

interface MusicRecommendation {
    id: string;
    title: string;
    artist: string;
    category: string;
    duration: number;
    coverImage: string;
    previewUrl: string;
    description: string[];
}

// Assessment questions
const ASSESSMENT_QUESTIONS = [
    "How would you rate your mood today?",
    "Have you been enjoying activities that you usually find pleasurable?",
    "How has your sleep been recently?",
    "How would you describe your energy levels?",
    "How is your appetite lately?",
    "Have you been able to concentrate on tasks?",
    "Do you often feel overwhelmed?",
    "How would you describe your outlook on the future?",
    "Do you feel supported by friends and family?",
    "Have you had thoughts that life isn't worth living?"
];

// Assessment options
const ASSESSMENT_OPTIONS = [
    ["1 - Very bad", "2 - Bad", "3 - Neutral", "4 - Good", "5 - Very good"],
    ["Yes", "No"],
    ["Very poor", "Poor", "Average", "Good", "Very good"],
    ["Very low", "Low", "Moderate", "High", "Very high"],
    ["Very poor", "Poor", "Average", "Good", "Very good"],
    ["Not at all", "Rarely", "Sometimes", "Often", "Always"],
    ["Never", "Rarely", "Sometimes", "Often", "Always"],
    ["Very negative", "Negative", "Neutral", "Positive", "Very positive"],
    ["Not at all", "A little", "Somewhat", "Mostly", "Completely"],
    ["Never", "Rarely", "Sometimes", "Often", "Always"]
];

const generateUniqueId = () => {
    messageCounter += 1;
    return `msg_${Date.now()}_${messageCounter}`;
};

const getCategoryColor = (category: string): string => {
    const colors = {
        meditation: '#8DAA6D',
        sleep: '#6A8D73',
        focus: '#F6BD60',
        nature: '#5D8A66',
        anxiety: '#9E88B0',
        stress: '#BD8C61'
    };
    return colors[category as keyof typeof colors] || '#8DAA6D';
};

// Add emotion colors function
const getEmotionColor = (emotion: string): string => {
    const emotionColors = {
        joy: '#4CAF50',
        sadness: '#2196F3',
        anger: '#F44336',
        fear: '#FF9800',
        neutral: '#9E9E9E'
    };
    return emotionColors[emotion as keyof typeof emotionColors] || '#9E9E9E';
};

const MusicRecommendationCard: React.FC<{
    recommendations: MusicRecommendation[];
    onPress: () => void;
}> = ({ recommendations, onPress }) => {
    if (!recommendations || recommendations.length === 0) return null;

    return (
        <View style={styles.musicRecommendationCard}>
            <View style={styles.musicCardHeader}>
                <Ionicons name="musical-notes" size={20} color="#8DAA6D" />
                <Text style={styles.musicCardTitle}>Music Recommendations</Text>
            </View>

            <Text style={styles.musicCardSubtitle}>
                {recommendations.length} personalized tracks to help you feel better
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.musicPreviewContainer}>
                {recommendations.slice(0, 3).map((track, index) => (
                    <View key={track.id} style={styles.musicPreviewItem}>
                        <Image source={{ uri: track.coverImage }} style={styles.musicPreviewImage} />
                        <Text style={styles.musicPreviewTitle} numberOfLines={1}>{track.title}</Text>
                        <Text style={styles.musicPreviewArtist} numberOfLines={1}>{track.artist}</Text>
                        <View style={[styles.musicCategoryBadge, { backgroundColor: getCategoryColor(track.category) }]}>
                            <Text style={styles.musicCategoryText}>{track.category}</Text>
                        </View>
                    </View>
                ))}
            </ScrollView>

            <TouchableOpacity style={styles.viewMusicButton} onPress={onPress}>
                <Text style={styles.viewMusicButtonText}>🎵 Listen Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
        </View>
    );
};

const Chatbot: React.FC = () => {
    const { userToken, userData } = useContext(AuthContext);
    const route = useRoute<RouteProp<HomeStackParamList, 'Chatbot'>>();
    const navigation = useNavigation<StackNavigationProp<any>>();
    const conversationId = route.params?.conversationId;
    const loadExisting = route.params?.loadExisting;

    const [musicRecommendations, setMusicRecommendations] = useState<MusicRecommendation[]>([]);
    const [showMusicRecommendations, setShowMusicRecommendations] = useState(false);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [inAssessment, setInAssessment] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [assessmentResponses, setAssessmentResponses] = useState<string[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);
    const [loadingConversation, setLoadingConversation] = useState(false);

    const [messages, setMessages] = useState<ChatMessage[]>(
        !loadExisting ? [
            {
                id: generateUniqueId(),
                text: 'Hello! I am MindCare AI assistant. How can I help you today? Type "start assessment" to begin a mental health evaluation.',
                sender: 'bot',
                timestamp: new Date(),
            },
        ] : []
    );

    useEffect(() => {
        if (conversationId && loadExisting) {
            loadExistingConversation(conversationId);
        }
    }, [conversationId, loadExisting]);

    useEffect(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    // Add debug logging for user data
    useEffect(() => {
        console.log('🔍 User data in Chatbot:', userData);
        console.log('🆔 User ID:', userData?.id || userData?._id);
    }, [userData]);

    const loadExistingConversation = async (convId: string) => {
        try {
            setLoadingConversation(true);
            console.log('📖 Loading conversation:', convId);

            const response = await axios.get(`${VITAL_SIGNS_URL}/api/conversation/${convId}`, {
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.success && response.data.conversation) {
                const conversation = response.data.conversation;
                console.log('📖 Loaded conversation:', conversation);

                const loadedMessages: ChatMessage[] = [];

                if (conversation.messages && conversation.messages.length > 0) {
                    conversation.messages.forEach((msg: any) => {
                        const chatMessage: ChatMessage = {
                            id: msg._id || generateUniqueId(),
                            text: msg.text || '',
                            sender: msg.sender || 'bot',
                            timestamp: new Date(msg.timestamp || Date.now()),
                        };
                        loadedMessages.push(chatMessage);
                    });
                }

                if (conversation.assessmentResults && conversation.assessmentResults.completed) {
                    const assessmentSummary: ChatMessage = {
                        id: generateUniqueId(),
                        text: `📋 Assessment Results:\nStress Level: ${conversation.assessmentResults.stressLevel}/5\nMood: ${conversation.assessmentResults.mood}\n\n${conversation.assessmentResults.recommendations}`,
                        sender: 'bot',
                        timestamp: new Date(conversation.assessmentResults.completedAt || Date.now()),
                    };
                    loadedMessages.push(assessmentSummary);
                }

                setMessages(loadedMessages);

                if (conversation.topic && conversation.topic.includes('Assessment')) {
                    navigation.setOptions({
                        title: 'Assessment Results'
                    });
                }

            } else {
                console.error('Failed to load conversation:', response.data);
            }

        } catch (error) {
            console.error('❌ Error loading conversation:', error);
            const errorMessage: ChatMessage = {
                id: generateUniqueId(),
                text: "Sorry, I couldn't load this conversation. Please try again.",
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages([errorMessage]);
        } finally {
            setLoadingConversation(false);
        }
    };

    const handleMusicRecommendationPress = () => {
        if (musicRecommendations && musicRecommendations.length > 0) {
            navigation.navigate('MusicSelection' as any, {
                existingTracks: musicRecommendations.map(rec => ({
                    id: rec.id,
                    title: rec.title,
                    artist: rec.artist,
                    album: 'Recommended',
                    duration: rec.duration,
                    coverImage: rec.coverImage,
                    previewUrl: rec.previewUrl,
                    category: rec.category,
                    popularity: 85,
                    type: 'track',
                    description: rec.description.join(', ')
                })),
                autoPlay: false
            });
        }
    };

    const startAssessment = () => {
        setInAssessment(true);
        setCurrentQuestionIndex(0);
        setAssessmentResponses([]);

        const options = ASSESSMENT_OPTIONS[0].map((opt, i) => `${i + 1}. ${opt}`).join('\n');

        const botMessage: ChatMessage = {
            id: generateUniqueId(),
            text: "I'll ask you 10 questions to understand how you're feeling. Please answer by entering a number between 1-5.\n\n" +
                ASSESSMENT_QUESTIONS[0] + "\n" + options,
            sender: 'bot',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
    };

    const getStressLevelDescription = (level: number): string => {
        switch (level) {
            case 1:
                return "Very Low Stress - You're doing great! Keep up your healthy habits.";
            case 2:
                return "Low Stress - Your stress levels are manageable. Continue your current self-care routine.";
            case 3:
                return "Moderate Stress - Consider incorporating more relaxation techniques into your daily routine.";
            case 4:
                return "High Stress - It would be beneficial to seek support and practice stress management techniques.";
            case 5:
                return "Very High Stress - Please consider speaking with a mental health professional for additional support.";
            default:
                return "Assessment completed.";
        }
    };

    const processAssessmentResponse = async (response: string) => {
        let processedResponse = response;

        if (/^[1-5]$/.test(response)) {
            const optionIndex = parseInt(response) - 1;
            const options = ASSESSMENT_OPTIONS[currentQuestionIndex];
            if (optionIndex >= 0 && optionIndex < options.length) {
                processedResponse = options[optionIndex];
            }
        }

        const newResponses = [...assessmentResponses, processedResponse];
        setAssessmentResponses(newResponses);

        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);

        if (nextIndex < ASSESSMENT_QUESTIONS.length) {
            const options = ASSESSMENT_OPTIONS[nextIndex].map((opt, i) => `${i + 1}. ${opt}`).join('\n');

            const nextQuestion: ChatMessage = {
                id: generateUniqueId(),
                text: ASSESSMENT_QUESTIONS[nextIndex] + "\n" + options,
                sender: 'bot',
                timestamp: new Date(),
            };

            setTimeout(() => {
                setMessages(prev => [...prev, nextQuestion]);
                setIsTyping(false);
            }, 1000);
        } else {
            setIsTyping(true);
            const waitingMessage: ChatMessage = {
                id: generateUniqueId(),
                text: "Please wait while I analyze your responses... This may take a moment.",
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, waitingMessage]);

            try {
                const userId = userData?.id || userData?._id;
                console.log('📋 Sending assessment with user ID:', userId);

                const response = await axios.post(`${VITAL_SIGNS_URL}/api/assessment`, {
                    responses: newResponses,
                    userId: userId
                });

                console.log('📋 Assessment response:', response.data);

                setMessages(prev => prev.slice(0, -1));

                const resultMessage: ChatMessage = {
                    id: generateUniqueId(),
                    text: response.data.message || `Assessment completed. Your stress level is ${response.data.severity}/5.`,
                    sender: 'bot',
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, resultMessage]);

                if (response.data.solutions) {
                    const solutionsMessage: ChatMessage = {
                        id: generateUniqueId(),
                        text: response.data.solutions,
                        sender: 'bot',
                        timestamp: new Date(),
                    };

                    setTimeout(() => {
                        setMessages(prev => [...prev, solutionsMessage]);
                    }, 1500);
                }

                if (response.data.severity) {
                    const stressMessage: ChatMessage = {
                        id: generateUniqueId(),
                        text: `📊 Your stress level assessment: ${response.data.severity}/5\n\n${getStressLevelDescription(response.data.severity)}`,
                        sender: 'bot',
                        timestamp: new Date(),
                    };

                    setTimeout(() => {
                        setMessages(prev => [...prev, stressMessage]);
                    }, 2500);
                }

                if (response.data.musicRecommendations && response.data.musicRecommendations.length > 0) {
                    const musicMessage: ChatMessage = {
                        id: generateUniqueId(),
                        text: `🎵 I've also prepared some music recommendations that might help you feel better.`,
                        sender: 'bot',
                        timestamp: new Date(),
                    };

                    setTimeout(() => {
                        setMessages(prev => [...prev, musicMessage]);
                        setMusicRecommendations(response.data.musicRecommendations);
                        setShowMusicRecommendations(true);
                    }, 3500);
                }

                setInAssessment(false);

            } catch (error) {
                console.error('❌ Error analyzing assessment:', error);
                if (error && typeof error === 'object' && 'response' in error) {
                    console.error('❌ Error details:', (error as any).response?.data);
                }

                setMessages(prev => prev.slice(0, -1));

                const errorMessage: ChatMessage = {
                    id: generateUniqueId(),
                    text: "I'm sorry, I couldn't analyze your responses right now. Please try again later.",
                    sender: 'bot',
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, errorMessage]);
                setInAssessment(false);
            } finally {
                setIsTyping(false);
            }
        }
    };

    const handleSendMessage = async () => {
        if (inputText.trim() === '') return;

        const userMessage: ChatMessage = {
            id: generateUniqueId(),
            text: inputText,
            sender: 'user',
            timestamp: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, userMessage]);

        const currentInput = inputText;
        setInputText('');
        setIsTyping(true);

        if (currentInput.toLowerCase().includes('start assessment') && !inAssessment) {
            startAssessment();
            setIsTyping(false);
            return;
        }

        if (currentInput.toLowerCase().includes('music') ||
            currentInput.toLowerCase().includes('listen') ||
            currentInput.toLowerCase().includes('songs')) {

            if (musicRecommendations && musicRecommendations.length > 0) {
                const musicResponseMessage: ChatMessage = {
                    id: generateUniqueId(),
                    text: `Great! I have ${musicRecommendations.length} personalized music recommendations for you.`,
                    sender: 'bot',
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, musicResponseMessage]);

                setTimeout(() => {
                    handleMusicRecommendationPress();
                }, 1000);

                setIsTyping(false);
                return;
            }
        }

        if (inAssessment) {
            processAssessmentResponse(currentInput);
            return;
        }

        try {
            const history = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

            history.push({
                role: 'user',
                content: currentInput
            });

            const userId = userData?.id || userData?._id;
            console.log('📤 Sending message with user ID:', userId);

            const response = await axios.post(`${VITAL_SIGNS_URL}/api/chat`, {
                message: currentInput,
                history: history,
                userId: userId
            });

            const botMessage: ChatMessage = {
                id: generateUniqueId(),
                text: response.data.reply || "I'm sorry, I couldn't process that. Can you try again?",
                sender: 'bot',
                timestamp: new Date(),
            };

            if (response.data.detected_emotion) {
                const updatedUserMessage = {
                    ...userMessage,
                    emotion: {
                        detected_emotion: response.data.detected_emotion,
                        emotion_confidence: response.data.emotion_confidence || 0.5
                    }
                };

                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages];
                    updatedMessages[updatedMessages.length - 1] = updatedUserMessage;
                    return [...updatedMessages, botMessage];
                });

                console.log(`🎭 Detected emotion: ${response.data.detected_emotion} (${(response.data.emotion_confidence * 100).toFixed(0)}%)`);
            } else {
                setMessages((prevMessages) => [...prevMessages, botMessage]);
            }

        } catch (error) {
            console.error('Error getting chatbot response:', error);

            const errorMessage: ChatMessage = {
                id: generateUniqueId(),
                text: "I'm having trouble connecting right now. Please try again later.",
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {loadExisting ? 'Conversation' : 'MindCare Assistant'}
                </Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            {/* Messages Container - adjust bottom padding to account for footer */}
            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={{ paddingBottom: 20 }} // Reduced padding
                showsVerticalScrollIndicator={true}
            >
                {loadingConversation ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#8DAA6D" />
                        <Text style={styles.loadingText}>Loading conversation...</Text>
                    </View>
                ) : (
                    messages.map((message) => (
                        <View key={message.id}>
                            <View
                                style={[
                                    styles.messageBubble,
                                    message.sender === 'user'
                                        ? styles.userMessage
                                        : styles.botMessage
                                ]}
                            >
                                <Text style={styles.messageText}>{message.text}</Text>
                                <Text style={styles.timestamp}>
                                    {message.timestamp.toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </Text>
                            </View>

                            {message.sender === 'user' && message.emotion && (
                                <View style={styles.emotionIndicator}>
                                    <View
                                        style={[
                                            styles.emotionDot,
                                            { backgroundColor: getEmotionColor(message.emotion.detected_emotion) }
                                        ]}
                                    />
                                    <Text style={styles.emotionText}>
                                        {message.emotion.detected_emotion} ({(message.emotion.emotion_confidence * 100).toFixed(0)}%)
                                    </Text>
                                </View>
                            )}
                        </View>
                    ))
                )}

                {showMusicRecommendations && musicRecommendations && musicRecommendations.length > 0 && (
                    <MusicRecommendationCard
                        recommendations={musicRecommendations}
                        onPress={handleMusicRecommendationPress}
                    />
                )}

                {isTyping && (
                    <View style={[styles.messageBubble, styles.botMessage]}>
                        <ActivityIndicator size="small" color="#666" />
                    </View>
                )}
            </ScrollView>

            {/* Footer Container - Fixed at bottom */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
                style={styles.footerContainer}
            >
                {/* Number buttons for assessment */}
                {inAssessment && (
                    <View style={styles.numberButtonsContainer}>
                        {[1, 2, 3, 4, 5].map((num) => (
                            <TouchableOpacity
                                key={`num-${num}`}
                                style={styles.numberButton}
                                onPress={() => {
                                    setInputText(num.toString());
                                    setTimeout(() => {
                                        handleSendMessage();
                                    }, 300);
                                }}
                            >
                                <Text style={styles.numberButtonText}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Input Container */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={(text) => {
                            if (inAssessment) {
                                const filtered = text.replace(/[^1-5]/g, '');
                                if (filtered.length > 1) {
                                    setInputText(filtered.charAt(0));
                                } else {
                                    setInputText(filtered);
                                }
                            } else {
                                setInputText(text);
                            }
                        }}
                        placeholder={inAssessment ? "Enter a number (1-5)..." : "Type your message..."}
                        placeholderTextColor="#999"
                        onSubmitEditing={handleSendMessage}
                        returnKeyType="send"
                        keyboardType={inAssessment ? "number-pad" : "default"}
                        maxLength={inAssessment ? 1 : undefined}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            inputText.trim() === '' ? styles.disabledButton : {}
                        ]}
                        onPress={handleSendMessage}
                        disabled={inputText.trim() === ''}
                    >
                        <Ionicons
                            name="send"
                            size={24}
                            color={inputText.trim() === '' ? "#CCC" : "#FFF"}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.marron,
        padding: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        flex: 1,
        textAlign: 'center',
    },
    headerRightPlaceholder: {
        width: 32,
    },
    messagesContainer: {
        flex: 1,
        padding: 16,
        marginBottom: 0, // Remove margin to connect with footer
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 12,
        color: '#666',
        fontSize: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 18,
        marginBottom: 12,
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#8DAA6D',
        borderBottomRightRadius: 4,
    },
    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 2,
        elevation: 2,
    },
    messageText: {
        fontSize: 16,
        color: '#333',
    },
    timestamp: {
        fontSize: 12,
        color: '#666',
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    emotionIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginRight: 16,
        marginTop: 4,
        marginBottom: 8,
    },
    emotionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    emotionText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
    },
    // Updated footer styles
    footerContainer: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for home indicator on iOS
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    numberButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    numberButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#8DAA6D',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    numberButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: 'white',
    },
    inputContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        color: '#333',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#8DAA6D',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
        shadowOpacity: 0,
        elevation: 0,
    },
    // Remove these old styles as they're no longer needed
    // tabBarSpace: {
    //     height: 90,
    // },
    // keyboardAvoidContainer: {
    //     width: '100%',
    // },
    musicRecommendationCard: {
        backgroundColor: '#F8F9FA',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#8DAA6D',
    },
    musicCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    musicCardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 8,
    },
    musicCardSubtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    musicPreviewContainer: {
        marginBottom: 12,
    },
    musicPreviewItem: {
        width: 100,
        marginRight: 12,
        alignItems: 'center',
    },
    musicPreviewImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginBottom: 6,
    },
    musicPreviewTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        textAlign: 'center',
        marginBottom: 2,
    },
    musicPreviewArtist: {
        fontSize: 10,
        color: '#666',
        textAlign: 'center',
        marginBottom: 4,
    },
    musicCategoryBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    musicCategoryText: {
        fontSize: 8,
        fontWeight: '600',
        color: '#FFF',
        textTransform: 'capitalize',
    },
    viewMusicButton: {
        flexDirection: 'row',
        backgroundColor: '#8DAA6D',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    viewMusicButtonText: {
        color: '#FFF',
        fontWeight: '600',
        marginRight: 8,
    },
});

export default Chatbot;