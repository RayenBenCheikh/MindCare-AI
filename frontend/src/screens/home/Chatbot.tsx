import { useContext, useEffect, useRef, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors } from '@/src/theme';
import { api, VITAL_SIGNS_URL, } from '@/src/api/config';
import { AuthContext } from '@/src/context/AuthContext';
import { useRoute, RouteProp } from '@react-navigation/native';
import { HomeStackParamList } from '@/src/navigation/HomeNavigation';
let messageCounter = 0;
// Get screen dimensions
interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: Date;
}

// Assessment questions from your Python model
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

// Assessment options matching the Python backend
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
// Create a helper function to generate unique IDs
const generateUniqueId = () => {
    messageCounter += 1;
    return `msg_${Date.now()}_${messageCounter}`;
};
const Chatbot: React.FC = () => {
    const { userToken, userData } = useContext(AuthContext);
    const route = useRoute<RouteProp<HomeStackParamList, 'Chatbot'>>();
    const conversationId = route.params?.conversationId;
    const [currentConversation, setCurrentConversation] = useState<any>(null);
    useEffect(() => {
        if (conversationId) {
            loadConversationMessages(conversationId);
        }
    }, [conversationId]);

    // Add function to load conversation messages
    const loadConversationMessages = async (id: string) => {
        try {
            setIsTyping(true); // Show loading state
            const response = await api.get(`/api/chatbot/${id}`);

            if (response.data.success && response.data.conversation) {
                setCurrentConversation(response.data.conversation);

                // Convert conversation messages to ChatMessage format
                if (response.data.conversation.messages && response.data.conversation.messages.length > 0) {
                    const formattedMessages = response.data.conversation.messages.map((msg: any) => ({
                        id: msg._id || generateUniqueId(),
                        text: msg.text,
                        sender: msg.sender,
                        timestamp: new Date(msg.timestamp)
                    }));

                    setMessages(formattedMessages);
                }
            }
        } catch (error) {
            console.error('Error loading conversation:', error);
            // Show error message
            const errorMessage: ChatMessage = {
                id: generateUniqueId(),
                text: "I couldn't load your previous conversation. Let's start a new one.",
                sender: 'bot',
                timestamp: new Date(),
            };
            setMessages([errorMessage]);
        } finally {
            setIsTyping(false);
        }
    };
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: generateUniqueId(),
            text: 'Hello! I am MindCare AI assistant. How can I help you today? Type "start assessment" to begin a mental health evaluation.',
            sender: 'bot',
            timestamp: new Date(),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [inAssessment, setInAssessment] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [assessmentResponses, setAssessmentResponses] = useState<string[]>([]);
    const scrollViewRef = useRef<ScrollView>(null);
    const [isSavingAssessment, setIsSavingAssessment] = useState(false);
    const saveAssessmentToDatabase = async (assessmentData: any) => {
        try {
            setIsSavingAssessment(true);

            // Check if user data exists and has an ID
            if (!userData || !userData.id) {
                console.error('Cannot save assessment: No user ID available', userData);
                const errorMessage: ChatMessage = {
                    id: generateUniqueId(),
                    text: "I couldn't save your assessment because your user information isn't available.",
                    sender: 'bot',
                    timestamp: new Date(),
                };
                setMessages(prev => [...prev, errorMessage]);
                return;
            }

            console.log('User data available, with ID:', userData.id);
            console.log('Saving assessment data:', assessmentData);

            // Create a description that includes assessment details
            const assessmentDate = new Date().toLocaleDateString();
            const stressLevel = assessmentData.severity;

            // Use the submit endpoint which updates existing assessment if present
            const formattedAssessment = {
                mood: {
                    id: assessmentData.mood,
                    label: assessmentData.mood === "depression" ? "Depressed" : "Positive"
                },
                completedAt: new Date().toISOString(),
                isSubmitted: true,
                description: `Mental health assessment from ${assessmentDate} - Stress level: ${stressLevel}/5`,
                // Store relevant mental health data in appropriate fields
                stressLevel: {
                    id: "mentalhealth",
                    text: `Stress level ${stressLevel}`
                },
                // Add responses to existing fields where appropriate
                professionalHelp: assessmentData.severity >= 4 ? "recommended" : "optional",
                // We avoid creating new field structures
            };

            console.log('Sending properly formatted assessment:', formattedAssessment);

            // Use the submit endpoint which will update existing assessment
            const saveResponse = await api.post(
                '/api/assessments/submit',
                formattedAssessment,
                {
                    headers: {
                        'Authorization': `Bearer ${userToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('Assessment saved successfully:', saveResponse.data);
            const savedMessage: ChatMessage = {
                id: generateUniqueId(),
                text: `Your assessment has been updated with your mental health status.`,
                sender: 'bot',
                timestamp: new Date(),
            };
            try {
                const saveResultsResponse = await api.post('/api/chatbot/assessment-results', {
                    responses: assessmentData.responses,
                    analysis: assessmentData.message,
                    recommendations: assessmentData.solutions,
                    stressLevel: assessmentData.severity,
                    mood: assessmentData.mood
                });

                console.log('Assessment results saved separately:', saveResultsResponse.data);
            } catch (error) {
                console.error('Error saving assessment results:', error);
            }

            setTimeout(() => {
                setMessages(prev => [...prev, savedMessage]);
                saveChatMessage(savedMessage);
            }, 500);

        } catch (error) {
            console.error('Error saving assessment:', error);

            // More detailed logging
            if (axios.isAxiosError(error)) {
                console.error('Request URL:', error.config?.url);
                console.error('Request data:', error.config?.data ? JSON.stringify(error.config.data) : null);
                console.error('Response status:', error.response?.status);
                console.error('Response data:', error.response?.data);
            }

            const errorMessage: ChatMessage = {
                id: generateUniqueId(),
                text: "I couldn't save your assessment to your health record. Your results are still valid and you can try again later.",
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsSavingAssessment(false);
        }
    };
    useEffect(() => {
        // Scroll to bottom when messages change
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const startAssessment = () => {
        setInAssessment(true);
        setCurrentQuestionIndex(0);
        setAssessmentResponses([]);

        // Show available options for first question with clear numbering
        const options = ASSESSMENT_OPTIONS[0].map((opt, i) => `${i + 1}. ${opt}`).join('\n');

        // Add first question with clear instructions
        const botMessage: ChatMessage = {
            id: generateUniqueId(),
            text: "I'll ask you 10 questions to understand how you're feeling. Please answer by entering a number between 1-5.\n\n" +
                ASSESSMENT_QUESTIONS[0] + "\n" + options,
            sender: 'bot',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
        saveChatMessage(botMessage);
    };
    const saveChatMessage = async (message: ChatMessage) => {
        if (!userData || !userData.id || !userToken) return;

        try {
            // If we have a conversation ID, include it
            const payload = {
                userId: userData.id,
                text: message.text,
                sender: message.sender,
                timestamp: message.timestamp,
                conversationId: conversationId // Will be undefined for new conversations
            };

            await api.post('/api/chatbot/messages', payload);
            console.log('Chat message saved to conversation');
        } catch (error) {
            console.error('Error saving chat message:', error);
        }
    };

    const processAssessmentResponse = async (response: string) => {
        // Try to map numerical responses (1-5) to the actual option text
        let processedResponse = response;

        // If it's just a number, convert it to the corresponding option
        if (/^[1-5]$/.test(response)) {
            const optionIndex = parseInt(response) - 1;
            const options = ASSESSMENT_OPTIONS[currentQuestionIndex];
            if (optionIndex >= 0 && optionIndex < options.length) {
                processedResponse = options[optionIndex];
            }
        }

        // Store the response
        const newResponses = [...assessmentResponses, processedResponse];
        setAssessmentResponses(newResponses);

        // Move to next question
        const nextIndex = currentQuestionIndex + 1;
        setCurrentQuestionIndex(nextIndex);

        // If there are more questions, ask the next one
        if (nextIndex < ASSESSMENT_QUESTIONS.length) {
            // Show available options for next question
            const options = ASSESSMENT_OPTIONS[nextIndex].map((opt, i) => `${i + 1}. ${opt}`).join('\n');

            const nextQuestion: ChatMessage = {
                id: generateUniqueId(),
                text: ASSESSMENT_QUESTIONS[nextIndex] + "\n" + options,
                sender: 'bot',
                timestamp: new Date(),
            };

            setTimeout(() => {
                setMessages(prev => [...prev, nextQuestion]);
                saveChatMessage(nextQuestion); // Add this line
                setIsTyping(false);
            }, 1000);
        } else {
            // Assessment complete, send all responses for analysis
            setIsTyping(true);
            const waitingMessage: ChatMessage = {
                id: generateUniqueId(),
                text: "Please wait while I analyze your responses... This may take a moment.",
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, waitingMessage]);
            saveChatMessage(waitingMessage);

            try {
                const response = await axios.post(`${VITAL_SIGNS_URL}/api/assessment`, {
                    responses: newResponses
                });

                // Display results (REMOVE THE DUPLICATE WAITING MESSAGE HERE)
                const resultMessage: ChatMessage = {
                    id: generateUniqueId(),
                    text: response.data.message || "Assessment complete. Thank you for your responses.",
                    sender: 'bot',
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, resultMessage]);
                saveChatMessage(resultMessage);
                // If solutions provided, display them
                if (response.data.solutions) {
                    const solutionsMessage: ChatMessage = {
                        id: generateUniqueId(),
                        text: response.data.solutions,
                        sender: 'bot',
                        timestamp: new Date(),
                    };
                    // Save assessment results to database with user info
                    if (userData && userToken) {
                        const assessmentData = {
                            responses: newResponses,
                            severity: response.data.severity,
                            mood: response.data.mood,
                            message: response.data.message,
                            solutions: response.data.solutions
                        };

                        saveAssessmentToDatabase(assessmentData);
                    }

                    setTimeout(() => {
                        setMessages(prev => [...prev, solutionsMessage]);
                        saveChatMessage(solutionsMessage);
                    }, 1000);
                }

                // If high stress level with suicidal thoughts, add emergency message
                if (response.data.severity >= 4 && newResponses[9].includes("Sometimes") ||
                    newResponses[9].includes("Often") || newResponses[9].includes("Always")) {

                    const emergencyMessage: ChatMessage = {
                        id: generateUniqueId(),
                        text:
                            "Your life matters, and support is available.",
                        sender: 'bot',
                        timestamp: new Date(),
                    };

                    setTimeout(() => {
                        setMessages(prev => [...prev, emergencyMessage]);
                        saveChatMessage(emergencyMessage);
                    }, 2000);
                }

                // Reset assessment state
                setInAssessment(false);

            } catch (error) {
                console.error('Error analyzing assessment:', error);

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
        saveChatMessage(userMessage);
        setIsTyping(true);
        if (currentInput.toLowerCase().includes('start assessment') && !inAssessment) {
            startAssessment();
            setIsTyping(false);
            return;
        }

        // If in assessment mode, handle differently
        if (inAssessment) {
            processAssessmentResponse(currentInput);
            return;
        }

        // Normal chat flow
        try {
            // Get conversation history in correct format
            const history = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

            // Add current message
            history.push({
                role: 'user',
                content: currentInput
            });

            // Call your backend API
            const response = await axios.post(`${VITAL_SIGNS_URL}/api/chat`, {
                message: currentInput,
                history: history
            });

            // Process the response
            const botMessage: ChatMessage = {
                id: generateUniqueId(),
                text: response.data.reply || "I'm sorry, I couldn't process that. Can you try again?",
                sender: 'bot',
                timestamp: new Date(),
            };

            setMessages((prevMessages) => [...prevMessages, botMessage]);
            saveChatMessage(botMessage);
        } catch (error) {
            console.error('Error getting chatbot response:', error);

            // Add fallback response
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
                <Text style={styles.headerTitle}>MindCare Assistant</Text>
            </View>

            <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={{ paddingBottom: 180 }} // Increased for combined input+tabbar
                showsVerticalScrollIndicator={true}
            >
                {messages.map((message) => (
                    <View
                        key={message.id}
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
                ))}

                {isTyping && (
                    <View style={[styles.messageBubble, styles.botMessage]}>
                        <ActivityIndicator size="small" color="#666" />
                    </View>
                )}
            </ScrollView>

            {/* Footer container that includes input field + tab bar spacing */}
            <View style={styles.footerContainer}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={120}
                    style={styles.keyboardAvoidContainer}
                >
                    <View style={styles.inputContainer}>
                        {inAssessment && (
                            <View style={styles.numberButtonsContainer}>
                                {[1, 2, 3, 4, 5].map((num) => (
                                    <TouchableOpacity
                                        key={`num-${num}`}
                                        style={styles.numberButton}
                                        onPress={() => {
                                            setInputText(num.toString());
                                            // Auto-submit after a brief delay for better UX
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
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={(text) => {
                                // For assessment, only allow numbers 1-5
                                if (inAssessment) {
                                    // Filter to only allow digits 1-5
                                    const filtered = text.replace(/[^1-5]/g, '');

                                    // Only take the first digit if multiple are entered
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
                            keyboardType={inAssessment ? "number-pad" : "default"} // Use number pad for assessment
                            maxLength={inAssessment ? 1 : undefined} // Limit to single digit during assessment
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

                {/* Space for the tab bar that will render underneath */}
                <View style={styles.tabBarSpace} />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.black,
    },
    header: {
        backgroundColor: colors.marron,
        padding: 16,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    messagesContainer: {
        flex: 1,
        padding: 16,
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
    footerContainer: {
        width: '100%',
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: 'transparent',
    },
    keyboardAvoidContainer: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        zIndex: 100,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    input: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 24,
        padding: 12,
        marginRight: 8,
        color: '#333',
    },
    sendButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#8DAA6D',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#E0E0E0',
    },
    tabBarSpace: {
    },
    numberButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
        backgroundColor: '#F5F5F5',
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
        marginHorizontal: 5,
    },
    numberButtonText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
});
export default Chatbot;