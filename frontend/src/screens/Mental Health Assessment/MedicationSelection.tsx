import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Alert,
    ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import { useAssessmentStore } from '@/src/store/Store';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ContinueButton from '@/src/components/Continue';
import { AuthContext } from '@/src/context/AuthContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type MedicationOption = 'prescribed' | 'otc' | 'none' | 'no_answer' | null;

const MedicationSelection: React.FC = () => {
    const [selectedOption, setSelectedOption] = useState<MedicationOption>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigation = useNavigation<NavigationProp>();
    const { userToken } = useContext(AuthContext);

    const setMedication = useAssessmentStore(state => state.setMedication);
    const submitAssessment = useAssessmentStore(state => state.submitAssessment);
    const isLoading = useAssessmentStore(state => state.isLoading);

    const handleOptionSelect = (option: MedicationOption) => {
        setSelectedOption(option);
    };

    const handleContinue = async () => {
        if (!selectedOption) {
            Alert.alert('Selection Required', 'Please select an option before continuing.');
            return;
        }

        // Check if user is authenticated
        if (!userToken) {
            Alert.alert(
                'Authentication Required',
                'Please login to save your assessment.',
                [{ text: 'OK' }]
            );
            return;
        }

        try {
            setIsSubmitting(true);

            // Save medication selection
            setMedication(selectedOption);

            console.log('Selected medication option:', selectedOption);
            console.log('User token available:', !!userToken);

            // If user selected medications, go to medication details
            if (selectedOption === 'prescribed' || selectedOption === 'otc') {
                navigation.navigate('MedicamentSelection');
                return;
            }

            // Otherwise, submit the assessment
            try {
                console.log('Submitting final assessment...');
                const response = await submitAssessment();
                console.log('Assessment submitted successfully:', response);

                // Show success message
                Alert.alert(
                    'Assessment Completed! 🎉',
                    'Your mental health assessment has been saved successfully. You can now view your personalized dashboard.',
                    [
                        {
                            text: 'View Dashboard',
                            onPress: () => navigation.navigate('TabNavigator')
                        }
                    ]
                );
            } catch (error: any) {
                console.error('Error submitting assessment:', error);

                // Improved error message
                let errorMessage = 'There was a problem saving your assessment.';

                if (error.message) {
                    errorMessage = error.message;
                }

                Alert.alert(
                    'Submission Error',
                    errorMessage,
                    [
                        {
                            text: 'Try Again',
                            onPress: () => { }
                        },
                        {
                            text: 'Skip for Now',
                            onPress: () => navigation.navigate('TabNavigator')
                        }
                    ]
                );
            }
        } catch (error) {
            console.error('Error in handleContinue:', error);
            Alert.alert(
                'Error',
                'Something went wrong. Please try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const isButtonDisabled = !selectedOption || isSubmitting || isLoading;

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
                        disabled={isSubmitting || isLoading}
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
                        disabled={isSubmitting || isLoading}
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
                        disabled={isSubmitting || isLoading}
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
                        disabled={isSubmitting || isLoading}
                    >
                        <Icon name="close" size={32} color="#5D4037" style={styles.optionIcon} />
                        <Text style={styles.optionText}>Prefer not to say</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Loading Indicator */}
            {(isSubmitting || isLoading) && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#5D4037" />
                    <Text style={styles.loadingText}>
                        {selectedOption === 'prescribed' || selectedOption === 'otc'
                            ? 'Saving selection...'
                            : 'Submitting assessment...'}
                    </Text>
                </View>
            )}

            {/* Continue Button */}
            <ContinueButton
                onPress={handleContinue}
                disabled={isButtonDisabled}
                style={isButtonDisabled ? styles.disabledButton : undefined}
            />
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
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedOptionCard: {
        backgroundColor: '#A3B18A',
        borderWidth: 2,
        borderColor: '#5D4037',
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
    loadingContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#5D4037',
        textAlign: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
});

export default MedicationSelection;