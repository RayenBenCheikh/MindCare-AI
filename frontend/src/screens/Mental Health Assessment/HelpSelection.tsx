import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Image,
    Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import { useAssessmentStore } from '@/src/store/Store';
import { images } from '@/src/theme';
import ContinueButton from '@/src/components/Continue';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const HelpSelection: React.FC = () => {
    const [selectedOption, setSelectedOption] = useState<'yes' | 'no' | null>(null);
    const navigation = useNavigation<NavigationProp>();

    // Get the correct function from store - FIXED
    const setProfessionalHelp = useAssessmentStore(state => state.setProfessionalHelp);

    const handleOptionSelect = (option: 'yes' | 'no') => {
        setSelectedOption(option);
    };

    const handleContinue = async () => {
        if (selectedOption) {
            try {
                // Call the store function with the selected option - FIXED
                setProfessionalHelp(selectedOption);

                // Complete the assessment after this final question
                navigation.navigate('MedicationSelection'); // Change to your final screen
            } catch (error) {
                console.error('Error saving selection:', error);
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Assessment</Text>
                <View style={styles.progressPill}>
                    <Text style={styles.progressText}>8 of 10</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>
                Have you sought professional help before?
            </Text>

            {/* Illustration */}
            <View style={styles.illustrationContainer}>
                <Image
                    source={images.Professional}
                    style={{ width: 200, height: 200 }}
                    resizeMode="contain"
                />
            </View>

            {/* Selection Buttons */}
            <View style={styles.optionsContainer}>
                <TouchableOpacity
                    style={[
                        styles.optionButton,
                        selectedOption === 'yes' && styles.selectedOptionButton
                    ]}
                    onPress={() => handleOptionSelect('yes')}
                >
                    <Text style={[
                        styles.optionText,
                        selectedOption === 'yes' && styles.selectedOptionText
                    ]}>Yes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.optionButton,
                        selectedOption === 'no' && styles.selectedOptionButton
                    ]}
                    onPress={() => handleOptionSelect('no')}
                >
                    <Text style={[
                        styles.optionText,
                        selectedOption === 'no' && styles.selectedOptionText
                    ]}>No</Text>
                </TouchableOpacity>
            </View>

            {/* Continue Button */}
            <ContinueButton onPress={handleContinue} disabled={!selectedOption} />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    progressPill: {
        backgroundColor: '#E8DDD9',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 15,
    },
    progressText: {
        fontSize: 14,
        color: '#926247',
    },
    titleText: {
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#5D4037',
        lineHeight: 40,
    },
    illustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
    },
    optionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
        marginBottom: 40,
    },
    optionButton: {
        width: width / 2 - 30,
        paddingVertical: 15,
        borderRadius: 30,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedOptionButton: {
        backgroundColor: '#9CCC65',
        borderColor: '#9CCC65',
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#5D4037',
    },
    selectedOptionText: {
        color: 'white',
    },
    continueButton: {
        backgroundColor: '#5D4037',
        padding: 18,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },

});

export default HelpSelection;