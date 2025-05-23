import React, { useState, useEffect, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/src/theme';
import { AuthContext } from '@/src/context/AuthContext';

const LLM_OPTIONS = [
    {
        id: 'gemma',
        name: 'gemma3:4b',
        description: 'Google\'s lightweight model optimized for helpful dialogues and coding assistance'
    },
    {
        id: 'llama2',
        name: 'Llama2',
        description: 'Meta\'s open-source model with strong reasoning and instruction following'
    },
    {
        id: 'qwen3',
        name: 'qwen3:1.7b',
        description: 'Alibaba\'s compact model with excellent efficiency and multilingual support'
    },
];

const LLMSettings = () => {
    const navigation = useNavigation();
    const [selectedModel, setSelectedModel] = useState('llama2'); // Default model
    const { userData } = useContext(AuthContext);

    // Load saved preference on component mount
    useEffect(() => {
        const loadPreference = async () => {
            try {
                const savedModel = await AsyncStorage.getItem('preferredLLM');
                if (savedModel) {
                    setSelectedModel(savedModel);
                }
            } catch (error) {
                console.error('Error loading LLM preference:', error);
            }
        };

        loadPreference();
    }, []);

    const handleModelSelect = async (modelId: string) => {
        setSelectedModel(modelId);
        try {
            // Save to local storage
            await AsyncStorage.setItem('preferredLLM', modelId);

            // If you have a backend endpoint to save user preferences:
            if (userData?.id) {
                // Example of saving to backend (uncomment if you have this API)
                /*
                await api.post('/api/users/preferences', {
                  userId: userData.id,
                  preferredLLM: modelId
                });
                */
            }
        } catch (error) {
            console.error('Error saving LLM preference:', error);
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
                <Text style={styles.headerTitle}>AI LLM Checkpoints</Text>
                <View style={styles.headerRight} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.modelsContainer}>
                    {LLM_OPTIONS.map((model) => (
                        <TouchableOpacity
                            key={model.id}
                            style={[
                                styles.modelOption,
                                selectedModel === model.id && styles.selectedOption
                            ]}
                            onPress={() => handleModelSelect(model.id)}
                        >
                            <View style={styles.modelInfo}>
                                <Text style={[
                                    styles.modelName,
                                    selectedModel === model.id && styles.selectedText
                                ]}>
                                    {model.name}
                                </Text>
                                <Text style={styles.modelDescription}>{model.description}</Text>
                            </View>

                            <View style={[
                                styles.radioButton,
                                selectedModel === model.id && styles.radioButtonSelected
                            ]}>
                                {selectedModel === model.id && (
                                    <View style={styles.radioButtonInner} />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.infoContainer}>
                    <Ionicons name="information-circle-outline" size={20} color="#666" />
                    <Text style={styles.infoText}>
                        Different models have different capabilities and response speeds.
                        Your choice affects your conversation experience.
                    </Text>
                </View>
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
        width: 24, // For balance
    },
    content: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 20,
    },
    modelsContainer: {
        marginBottom: 20,
    },
    modelOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        borderRadius: 25,
        padding: 15,
        marginBottom: 12,
    },
    selectedOption: {
        backgroundColor: '#B5C99A',
    },
    modelInfo: {
        flex: 1,
    },
    modelName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
        color: '#333',
    },
    selectedText: {
        color: '#fff',
    },
    modelDescription: {
        fontSize: 14,
        color: '#666',
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
    },
});

export default LLMSettings;