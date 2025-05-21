import { useEffect, useRef, useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { colors } from '@/src/theme';
import { api, VITAL_SIGNS_URL, } from '@/src/api/config';
let messageCounter = 0;
// Get screen dimensions
const { height: screenHeight } = Dimensions.get('window');
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

    useEffect(() => {
        // Scroll to bottom when messages change
        scrollViewRef.current?.scrollToEnd({ animated: true });
    }, [messages]);

    const startAssessment = () => {
        setInAssessment(true);
        setCurrentQuestionIndex(0);
        setAssessmentResponses([]);

        // Show available options for first question
        const options = ASSESSMENT_OPTIONS[0].map((opt, i) => `${i + 1}. ${opt}`).join('\n');

        // Add first question
        const botMessage: ChatMessage = {
            id: generateUniqueId(),
            text: "I'll ask you 10 questions to understand how you're feeling. Please answer honestly to help me provide better support.\n\n" +
                ASSESSMENT_QUESTIONS[0] + "\n" + options,
            sender: 'bot',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, botMessage]);
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
                setIsTyping(false);
            }, 1000);
        } else {
            // Assessment complete, send all responses for analysis
            setIsTyping(true);

            try {
                const response = await axios.post(`${VITAL_SIGNS_URL}/api/assessment`, {
                    responses: newResponses
                });

                // Display results
                const resultMessage: ChatMessage = {
                    id: generateUniqueId(),
                    text: response.data.message || "Assessment complete. Thank you for your responses.",
                    sender: 'bot',
                    timestamp: new Date(),
                };

                setMessages(prev => [...prev, resultMessage]);

                // If solutions provided, display them
                if (response.data.solutions) {
                    const solutionsMessage: ChatMessage = {
                        id: generateUniqueId(),
                        text: response.data.solutions,
                        sender: 'bot',
                        timestamp: new Date(),
                    };

                    setTimeout(() => {
                        setMessages(prev => [...prev, solutionsMessage]);
                    }, 1000);
                }

                // If high stress level with suicidal thoughts, add emergency message
                if (response.data.severity >= 4 && newResponses[9].includes("Sometimes") ||
                    newResponses[9].includes("Often") || newResponses[9].includes("Always")) {

                    const emergencyMessage: ChatMessage = {
                        id: generateUniqueId(),
                        text: "IMPORTANT: If you're having thoughts that life isn't worth living, please reach out for help. " +
                            "Crisis resources: National Suicide Prevention Lifeline: 1-800-273-8255 " +
                            "Or text HOME to 741741 to reach the Crisis Text Line. " +
                            "Your life matters, and support is available.",
                        sender: 'bot',
                        timestamp: new Date(),
                    };

                    setTimeout(() => {
                        setMessages(prev => [...prev, emergencyMessage]);
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

        // Show typing indicator
        setIsTyping(true);

        // Check if starting assessment
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
                contentContainerStyle={{ paddingBottom: 160 }} // Increase padding to ensure content doesn't hide behind input
                showsVerticalScrollIndicator={true} // Make sure scrollbar is visible
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

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={120} // Increase offset to avoid keyboard covering input
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={inAssessment ? "Type your answer (1-5)..." : "Type your message..."}
                    placeholderTextColor="#999"
                    onSubmitEditing={handleSendMessage}
                    returnKeyType="send"
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
            </KeyboardAvoidingView>

            {/* This spacer gives room for the tab bar */}
            <View style={styles.tabBarSpacer} />
        </SafeAreaView>
    );
};

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
        marginBottom: 100, // Add margin to make space for input box
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
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        position: 'absolute',
        bottom: 90, // Adjust position to be slightly higher
        left: 0,
        right: 0,
        zIndex: 100,
        elevation: 5, // Add elevation for Android
        shadowColor: '#000', // Add shadow for iOS
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
    tabBarSpacer: {
        height: 85, // Height for the tab bar space
    },
});

export default Chatbot;