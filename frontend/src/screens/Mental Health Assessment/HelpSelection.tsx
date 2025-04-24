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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SvgXml } from 'react-native-svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

const HelpSelection: React.FC = () => {
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const navigation = useNavigation<NavigationProp>();

    const handleOptionSelect = (option: string) => {
        setSelectedOption(option);
    };

    const handleContinue = async () => {
        if (selectedOption) {
            try {
                // Store the selected option
                await AsyncStorage.setItem('professionalHelp', selectedOption);
                // Navigate to the next screen
                navigation.navigate('MoodSelection'); // Replace with your next screen
            } catch (error) {
                console.error('Error saving selection:', error);
            }
        }
    };

    // SVG for the illustration
    const illustrationSvg = `
    <svg width="300" height="300" viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Question mark 1 -->
        <text x="120" y="100" font-family="Arial" font-size="40" fill="#C9B5FD">?</text>
        
        <!-- Question mark 2 -->
        <text x="230" y="130" font-family="Arial" font-size="40" fill="#C9B5FD">?</text>
        
        <!-- Question mark 3 -->
        <text x="60" y="180" font-family="Arial" font-size="40" fill="#C9B5FD">?</text>
        
        <!-- Gray circle background -->
        <circle cx="150" cy="180" r="80" fill="#E5E5E5" />
        
        <!-- Confused character -->
        <path d="M190 180 Q200 100 170 120 Q150 130 140 150 Q130 170 150 190 Q170 210 190 180 Z" fill="#F39C12" stroke="#653E1D" stroke-width="2" />
        <path d="M150 130 Q160 120 170 130 Q180 140 170 150 Q160 160 150 150 Q140 140 150 130 Z" fill="#653E1D" />
        <path d="M140 150 Q145 155 150 150 Q155 145 160 150 Q165 155 160 160 Q155 165 150 160 Q145 155 140 150 Z" fill="#F39C12" stroke="#653E1D" stroke-width="1" />
        
        <!-- Confused lines -->
        <path d="M110 80 Q130 60 150 70 Q170 80 190 60 Q210 40 230 60 Q250 80 230 100 Q210 120 190 100 Q170 80 150 90 Q130 100 110 80" fill="none" stroke="#653E1D" stroke-width="2" />
    </svg>`;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Assessment</Text>
                <View style={styles.progressPill}>
                    <Text style={styles.progressText}>6 of 14</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>
                Have you sought professional help before?
            </Text>

            {/* Illustration */}
            <View style={styles.illustrationContainer}>
                <SvgXml xml={illustrationSvg} width={280} height={280} />
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
            <TouchableOpacity
                style={[
                    styles.continueButton,
                    !selectedOption && styles.continueButttonDisabled
                ]}
                onPress={handleContinue}
                disabled={!selectedOption}
            >
                <Text style={styles.continueButtonText}>Continue</Text>
                <Text style={styles.continueArrow}>→</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
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
    continueButttonDisabled: {
        opacity: 0.7,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    continueArrow: {
        color: 'white',
        fontSize: 18,
        marginLeft: 8,
    },
});

export default HelpSelection;