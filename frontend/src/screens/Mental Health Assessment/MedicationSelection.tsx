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
// Define icons for the options
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Path } from 'react-native-svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type MedicationOption = 'prescribed' | 'otc' | 'none' | 'no_answer' | null;

const MedicationSelection: React.FC = () => {
    const [selectedOption, setSelectedOption] = useState<MedicationOption>(null);
    const navigation = useNavigation<NavigationProp>();
    const setMedication = useAssessmentStore(state => state.setMedication);

    const handleOptionSelect = (option: MedicationOption) => {
        setSelectedOption(option);
    };

    const handleContinue = () => {
        if (selectedOption) {
            // Save the selection to the store
            setMedication(selectedOption);

            // Navigate based on selection
            if (selectedOption === 'prescribed' || selectedOption === 'otc') {
                // Navigate to medication selection for both prescribed meds and OTC supplements
                navigation.navigate('MedicamentSelection');
            } else {
                // For 'none' or 'no_answer', go to the next screen
                navigation.navigate('AssessmentCompleted');
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
            <TouchableOpacity
                style={[
                    styles.continueButton,
                    !selectedOption && styles.continueButtonDisabled
                ]}
                onPress={handleContinue}
                disabled={!selectedOption}
            >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path
                        d="M17.9335 9.9124C16.5934 8.166 14.7145 6.9105 12.5882 6.3408L12.0706 8.2726C13.7716 8.7284 15.2748 9.7328 16.3468 11.1299C17.2145 12.2607 17.7606 13.5977 17.9373 15L0 15V17L17.9373 17C17.7606 18.4024 17.2145 19.7393 16.3468 20.8701C15.2748 22.2673 13.7716 23.2716 12.0706 23.7274L12.5882 25.6593C14.7145 25.0895 16.5934 23.8341 17.9335 22.0876C19.2736 20.3412 20 18.2014 20 16C20 13.7987 19.2736 11.6588 17.9335 9.9124Z"
                        fill="white"
                    />
                </Svg>
            </TouchableOpacity>
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