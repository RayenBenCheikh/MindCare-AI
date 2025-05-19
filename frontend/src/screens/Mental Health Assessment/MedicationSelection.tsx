import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import { useAssessmentStore } from '@/src/store/Store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import ContinueButton from '@/src/components/Continue';
import { api, API_BASE_URL } from '@/src/api/config';
import { API_ENDPOINTS } from '@/src/constants/const';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type MedicationOption = 'prescribed' | 'otc' | 'none' | 'no_answer' | null;

const MedicationSelection: React.FC = () => {
    const [selectedOption, setSelectedOption] = useState<MedicationOption>(null);
    const navigation = useNavigation<NavigationProp>();
    const setMedication = useAssessmentStore(state => state.setMedication);
    const submitAssessment = useAssessmentStore(state => state.submitAssessment);
    const handleOptionSelect = (option: MedicationOption) => {
        setSelectedOption(option);
    };

    const handleContinue = async () => {
        if (selectedOption) {
            setMedication(selectedOption);

            try {
                // Save data to your backend

                await submitAssessment();

                // Navigate after successful save
                if (selectedOption === 'prescribed' || selectedOption === 'otc') {
                    navigation.navigate('MedicamentSelection');
                } else {
                    navigation.navigate('TabNavigator');
                }
            } catch (error) {
                // Handle error (show message, etc.)
                console.error('Failed to save assessment:', error);
                // Optionally show an alert to the user
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8F5F0" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Assessment</Text>
                <View style={styles.progressPill}>
                    <Text style={styles.progressText}>9 of 10</Text>
                </View>
            </View>

            {/* Question */}
            <Text style={styles.titleText}>
                Are you taking any medications?
            </Text>

            {/* Options Grid */}
            <View style={styles.optionsGrid}>
                {/* Row 1 */}
                <View style={styles.optionsRow}>
                    {/* Prescribed Medications */}
                    <TouchableOpacity
                        style={[
                            styles.optionCard,
                            selectedOption === 'prescribed' && styles.selectedOptionCard
                        ]}
                        onPress={() => handleOptionSelect('prescribed')}
                    >
                        <Icon name="test-tube" size={32} color="#5D4037" style={styles.optionIcon} />
                        <Text style={styles.optionText}>Prescribed Medications</Text>
                    </TouchableOpacity>

                    {/* Over the Counter */}
                    <TouchableOpacity
                        style={[
                            styles.optionCard,
                            selectedOption === 'otc' && styles.selectedOptionCard
                        ]}
                        onPress={() => handleOptionSelect('otc')}
                    >
                        <Icon name="pill" size={32} color="#5D4037" style={styles.optionIcon} />
                        <Text style={styles.optionText}>Over the Counter Supplements</Text>
                    </TouchableOpacity>
                </View>

                {/* Row 2 */}
                <View style={styles.optionsRow}>
                    {/* Not Taking Any */}
                    <TouchableOpacity
                        style={[
                            styles.optionCard,
                            selectedOption === 'none' && styles.selectedOptionCard
                        ]}
                        onPress={() => handleOptionSelect('none')}
                    >
                        <Icon name="minus-circle-outline" size={32} color="#5D4037" style={styles.optionIcon} />
                        <Text style={styles.optionText}>I'm not taking any</Text>
                    </TouchableOpacity>

                    {/* Prefer Not to Say */}
                    <TouchableOpacity
                        style={[
                            styles.optionCard,
                            selectedOption === 'no_answer' && styles.selectedOptionCard
                        ]}
                        onPress={() => handleOptionSelect('no_answer')}
                    >
                        <Icon name="close" size={32} color="#5D4037" style={styles.optionIcon} />
                        <Text style={styles.optionText}>Prefer not to say</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Continue Button */}

            <ContinueButton onPress={handleContinue} disabled={!selectedOption} />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F5F0',
        paddingHorizontal: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 40,
    },
    headerText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#5D4037',
    },
    progressPill: {
        backgroundColor: '#E6DED5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    progressText: {
        fontSize: 14,
        color: '#5D4037',
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#5D4037',
        textAlign: 'center',
        marginBottom: 50,
    },
    optionsGrid: {
        flex: 1,
    },
    optionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    optionCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        aspectRatio: 1,
    },
    selectedOptionCard: {
        backgroundColor: '#A3B18A',
    },
    optionIcon: {
        marginBottom: 15,
    },
    optionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#5D4037',
        textAlign: 'center',
    },
    continueButton: {
        backgroundColor: '#5D4037',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 30,
        marginBottom: 30,
    },
    continueButtonDisabled: {
        opacity: 0.5,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginRight: 5,
    },
    continueArrow: {
        color: 'white',
        fontSize: 20,
        fontWeight: '600',
    },
});

export default MedicationSelection;