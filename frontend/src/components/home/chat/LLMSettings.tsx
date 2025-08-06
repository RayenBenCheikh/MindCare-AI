import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/src/theme';
import { AuthContext } from '@/src/context/AuthContext';
import { VITAL_SIGNS_URL } from '@/src/api/config';
import axios from 'axios';

interface ModelOption {
    id: string;
    name: string;
    description: string;
    type: 'emotion' | 'assessment';
}

const MODEL_OPTIONS: ModelOption[] = [
    {
        id: 'qwen3:8b',
        name: 'Qwen3 8B',
        description: 'Specialized in emotional support and empathetic conversations. Excellent for daily mood tracking and emotional guidance.',
        type: 'emotion'
    },
    {
        id: 'gemma3:4b',
        name: 'Gemma3 4B',
        description: 'Expert in mental health assessments and analytical tasks. Perfect for comprehensive stress analysis and coping strategies.',
        type: 'assessment'
    },
    {
        id: 'llama3.1:8b',
        name: 'Llama3.1 8B',
        description: 'Well-rounded model for general conversations and balanced responses.',
        type: 'emotion'
    },
    {
        id: 'deepseek-r1:7b',
        name: 'DeepSeek R1 7B',
        description: 'Great for reasoning and problem-solving tasks. Good for complex assessments.',
        type: 'assessment'
    }
];

const LLMSettings = () => {
    const navigation = useNavigation();
    const { userData } = useContext(AuthContext);
    const [selectedEmotionModel, setSelectedEmotionModel] = useState('qwen3:8b');
    const [selectedAssessmentModel, setSelectedAssessmentModel] = useState('gemma3:4b');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [availableModels, setAvailableModels] = useState<string[]>([]);

    useEffect(() => {
        loadPreferences();
        checkAvailableModels();
    }, []);

    const checkAvailableModels = async () => {
        try {
            const response = await axios.get(`${VITAL_SIGNS_URL}/api/models/available`);
            if (response.data.success) {
                const modelNames = response.data.models.map((m: any) => m.name);
                setAvailableModels(modelNames);
            }
        } catch (error) {
            console.error('Error fetching available models:', error);
        }
    };

    const loadPreferences = async () => {
        try {
            setLoading(true);

            // Try to load from server first
            if (userData?.id) {
                try {
                    const response = await axios.get(`${VITAL_SIGNS_URL}/api/user/preferences?userId=${userData.id}`);
                    if (response.data.success) {
                        setSelectedEmotionModel(response.data.emotionModel);
                        setSelectedAssessmentModel(response.data.assessmentModel);
                        return;
                    }
                } catch (serverError) {
                    console.log('Server preferences not available, using local storage');
                }
            }

            // Fallback to local storage
            const emotionModel = await AsyncStorage.getItem('preferredEmotionModel');
            const assessmentModel = await AsyncStorage.getItem('preferredAssessmentModel');

            if (emotionModel) setSelectedEmotionModel(emotionModel);
            if (assessmentModel) setSelectedAssessmentModel(assessmentModel);

        } catch (error) {
            console.error('Error loading preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleModelSelect = async (modelId: string, type: 'emotion' | 'assessment') => {
        try {
            setSaving(true);

            if (type === 'emotion') {
                setSelectedEmotionModel(modelId);
            } else {
                setSelectedAssessmentModel(modelId);
            }

            // Save to local storage immediately
            await AsyncStorage.setItem(`preferred${type === 'emotion' ? 'Emotion' : 'Assessment'}Model`, modelId);

            // Save to server if user is logged in
            if (userData?.id) {
                try {
                    await axios.post(`${VITAL_SIGNS_URL}/api/user/preferences`, {
                        userId: userData.id,
                        emotionModel: type === 'emotion' ? modelId : selectedEmotionModel,
                        assessmentModel: type === 'assessment' ? modelId : selectedAssessmentModel
                    });

                    Alert.alert(
                        'Settings Saved',
                        `${type === 'emotion' ? 'Emotion' : 'Assessment'} model updated to ${modelId}`,
                        [{ text: 'OK' }]
                    );
                } catch (serverError) {
                    console.error('Error saving to server:', serverError);
                    Alert.alert(
                        'Saved Locally',
                        'Settings saved locally. Will sync when server is available.',
                        [{ text: 'OK' }]
                    );
                }
            }

        } catch (error) {
            console.error('Error saving model preference:', error);
            Alert.alert('Error', 'Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const isModelAvailable = (modelId: string): boolean => {
        return availableModels.some(available => available.includes(modelId.split(':')[0]));
    };

    const getEmotionModels = () => MODEL_OPTIONS.filter(m => m.type === 'emotion');
    const getAssessmentModels = () => MODEL_OPTIONS.filter(m => m.type === 'assessment');

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.marron} />
                    <Text style={styles.loadingText}>Loading model preferences...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>AI Model Settings</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content}>
                {/* Emotion Models Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎭 Emotion & Chat Models</Text>
                    <Text style={styles.sectionDescription}>
                        Choose the AI model for emotional support and general conversations
                    </Text>

                    {getEmotionModels().map((model) => (
                        <TouchableOpacity
                            key={model.id}
                            style={[
                                styles.modelOption,
                                selectedEmotionModel === model.id && styles.selectedOption,
                                !isModelAvailable(model.id) && styles.unavailableOption
                            ]}
                            onPress={() => handleModelSelect(model.id, 'emotion')}
                            disabled={!isModelAvailable(model.id) || saving}
                        >
                            <View style={styles.modelInfo}>
                                <View style={styles.modelHeader}>
                                    <Text style={[
                                        styles.modelName,
                                        selectedEmotionModel === model.id && styles.selectedText,
                                        !isModelAvailable(model.id) && styles.unavailableText
                                    ]}>
                                        {model.name}
                                    </Text>
                                    {!isModelAvailable(model.id) && (
                                        <Text style={styles.unavailableBadge}>Not Available</Text>
                                    )}
                                </View>
                                <Text style={styles.modelDescription}>{model.description}</Text>
                            </View>

                            <View style={[
                                styles.radioButton,
                                selectedEmotionModel === model.id && styles.radioButtonSelected,
                                !isModelAvailable(model.id) && styles.radioButtonUnavailable
                            ]}>
                                {selectedEmotionModel === model.id && (
                                    <View style={styles.radioButtonInner} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Assessment Models Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📋 Assessment Models</Text>
                    <Text style={styles.sectionDescription}>
                        Choose the AI model for mental health assessments and analysis
                    </Text>

                    {getAssessmentModels().map((model) => (
                        <TouchableOpacity
                            key={model.id}
                            style={[
                                styles.modelOption,
                                selectedAssessmentModel === model.id && styles.selectedOption,
                                !isModelAvailable(model.id) && styles.unavailableOption
                            ]}
                            onPress={() => handleModelSelect(model.id, 'assessment')}
                            disabled={!isModelAvailable(model.id) || saving}
                        >
                            <View style={styles.modelInfo}>
                                <View style={styles.modelHeader}>
                                    <Text style={[
                                        styles.modelName,
                                        selectedAssessmentModel === model.id && styles.selectedText,
                                        !isModelAvailable(model.id) && styles.unavailableText
                                    ]}>
                                        {model.name}
                                    </Text>
                                    {!isModelAvailable(model.id) && (
                                        <Text style={styles.unavailableBadge}>Not Available</Text>
                                    )}
                                </View>
                                <Text style={styles.modelDescription}>{model.description}</Text>
                            </View>

                            <View style={[
                                styles.radioButton,
                                selectedAssessmentModel === model.id && styles.radioButtonSelected,
                                !isModelAvailable(model.id) && styles.radioButtonUnavailable
                            ]}>
                                {selectedAssessmentModel === model.id && (
                                    <View style={styles.radioButtonInner} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.infoContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        Your selections are automatically saved. Different models have different capabilities and response styles.
                        Emotion models focus on empathy, while assessment models focus on analysis.
                    </Text>
                </View>

                {saving && (
                    <View style={styles.savingContainer}>
                        <ActivityIndicator size="small" color={colors.marron} />
                        <Text style={styles.savingText}>Saving preferences...</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.marron,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        color: 'white',
        fontSize: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    headerRight: {
        width: 24,
    },
    content: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 16,
    },
    modelOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        elevation: 2,
    },
    selectedOption: {
        backgroundColor: '#B5C99A',
        borderWidth: 2,
        borderColor: '#8DAA6D',
    },
    unavailableOption: {
        backgroundColor: '#F5F5F5',
        opacity: 0.6,
    },
    modelInfo: {
        flex: 1,
    },
    modelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    modelName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        flex: 1,
    },
    selectedText: {
        color: '#fff',
    },
    unavailableText: {
        color: '#999',
    },
    unavailableBadge: {
        fontSize: 12,
        color: '#999',
        fontWeight: '500',
        backgroundColor: '#E0E0E0',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    modelDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#DDD',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
    },
    radioButtonSelected: {
        borderColor: 'white',
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    radioButtonUnavailable: {
        borderColor: '#CCC',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'white',
    },
    infoContainer: {
        flexDirection: 'row',
        backgroundColor: '#E8EFD3',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    infoText: {
        flex: 1,
        marginLeft: 10,
        color: '#666',
        fontSize: 14,
        lineHeight: 20,
    },
    savingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        backgroundColor: 'rgba(141, 170, 109, 0.1)',
        borderRadius: 10,
        marginTop: 15,
    },
    savingText: {
        marginLeft: 10,
        color: colors.marron,
        fontSize: 14,
    },
});

export default LLMSettings;