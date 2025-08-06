import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import ContinueButton from '@/src/components/Continue';
import { useAssessmentStore } from '@/src/store/Store';
import { SvgXml } from 'react-native-svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const sleepOptions = [
    {
        label: 'Excellent',
        hours: '7-9 HOURS',
        color: '#9CCC65',
        emoji: '😊',
        emojiSvg: `<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#9CCC65"/>
            <path d="M12 16C13.1 16 14 14.9 14 13.5C14 12.1 13.1 11 12 11C10.9 11 10 12.1 10 13.5C10 14.9 10.9 16 12 16Z" fill="#5D4037"/>
            <path d="M24 16C25.1 16 26 14.9 26 13.5C26 12.1 25.1 11 24 11C22.9 11 22 12.1 22 13.5C22 14.9 22.9 16 24 16Z" fill="#5D4037"/>
            <path d="M24 23C22.67 25 20.5 26 18 26C15.5 26 13.33 25 12 23C12 21.17 14.67 20 18 20C21.33 20 24 21.17 24 23Z" fill="#5D4037"/>
        </svg>`
    },
    {
        label: 'Good',
        hours: '6-7 HOURS',
        color: '#FFD54F',
        emoji: '🙂',
        emojiSvg: `<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#FFD54F"/>
            <path d="M12 16C13.1 16 14 14.9 14 13.5C14 12.1 13.1 11 12 11C10.9 11 10 12.1 10 13.5C10 14.9 10.9 16 12 16Z" fill="#5D4037"/>
            <path d="M24 16C25.1 16 26 14.9 26 13.5C26 12.1 25.1 11 24 11C22.9 11 22 12.1 22 13.5C22 14.9 22.9 16 24 16Z" fill="#5D4037"/>
            <path d="M12 22H24" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    {
        label: 'Fair',
        hours: '5 HOURS',
        color: '#D7CCC8',
        emoji: '😐',
        emojiSvg: `<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#D7CCC8"/>
            <path d="M12 16C13.1 16 14 14.9 14 13.5C14 12.1 13.1 11 12 11C10.9 11 10 12.1 10 13.5C10 14.9 10.9 16 12 16Z" fill="#5D4037"/>
            <path d="M24 16C25.1 16 26 14.9 26 13.5C26 12.1 25.1 11 24 11C22.9 11 22 12.1 22 13.5C22 14.9 22.9 16 24 16Z" fill="#5D4037"/>
            <path d="M12 22H24" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    {
        label: 'Poor',
        hours: '3-4 HOURS',
        color: '#F39C12',
        emoji: '😟',
        emojiSvg: `<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#F39C12"/>
            <path d="M12 16C13.1 16 14 14.9 14 13.5C14 12.1 13.1 11 12 11C10.9 11 10 12.1 10 13.5C10 14.9 10.9 16 12 16Z" fill="#5D4037"/>
            <path d="M24 16C25.1 16 26 14.9 26 13.5C26 12.1 25.1 11 24 11C22.9 11 22 12.1 22 13.5C22 14.9 22.9 16 24 16Z" fill="#5D4037"/>
            <path d="M12 26C14 24 16 23 18 23C20 23 22 24 24 26" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
    {
        label: 'Worst',
        hours: '<3 HOURS',
        color: '#7986CB',
        emoji: '😢',
        emojiSvg: `<svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="18" fill="#7986CB"/>
            <path d="M13 16L11 14" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
            <path d="M25 16L23 14" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
            <path d="M12 26C14 24 16 23 18 23C20 23 22 24 24 26" stroke="#5D4037" stroke-width="2" stroke-linecap="round"/>
        </svg>`
    },
];

const SleepSelection: React.FC = () => {
    const [selectedIndex, setSelectedIndex] = useState(2); // Default to "Fair" (middle option)
    const navigation = useNavigation<NavigationProp>();
    const setSleepQuality = useAssessmentStore(state => state.setSleepQuality);

    const handleOptionPress = (index: number) => {
        setSelectedIndex(index);
    };

    const handleContinue = async () => {
        try {
            const selectedOption = sleepOptions[selectedIndex];
            setSleepQuality(selectedOption.label, selectedOption.hours);
            navigation.navigate('HelpSelection');
        } catch (error) {
            console.error('Error saving sleep quality:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.headerContainer}>
                    <BackButton onPress={() => navigation.goBack()} />
                    <Text style={styles.headerText}>Assessment</Text>
                    <View style={styles.progressPill}>
                        <Text style={styles.progressText}>7 of 10</Text>
                    </View>
                </View>

                {/* Title */}
                <Text style={styles.titleText}>
                    How would you rate your sleep quality?
                </Text>

                {/* Sleep Quality Selection */}
                <View style={styles.selectionContainer}>
                    {sleepOptions.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.optionCard,
                                selectedIndex === index && styles.selectedCard
                            ]}
                            onPress={() => handleOptionPress(index)}
                            activeOpacity={0.7}
                        >
                            {/* Emoji */}
                            <View style={styles.emojiContainer}>
                                <SvgXml xml={option.emojiSvg} width={40} height={40} />
                            </View>

                            {/* Text Content */}
                            <View style={styles.textContainer}>
                                <Text style={[
                                    styles.qualityLabel,
                                    selectedIndex === index && styles.selectedLabel
                                ]}>
                                    {option.label}
                                </Text>
                                <View style={styles.hoursContainer}>
                                    <SvgXml
                                        xml={`<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="${selectedIndex === index ? '#5D4037' : '#BDBDBD'}" stroke-width="2"/>
                                            <path d="M12 6V12L16 16" stroke="${selectedIndex === index ? '#5D4037' : '#BDBDBD'}" stroke-width="2" stroke-linecap="round"/>
                                        </svg>`}
                                        width={14}
                                        height={14}
                                    />
                                    <Text style={[
                                        styles.hoursText,
                                        selectedIndex === index && styles.selectedHoursText
                                    ]}>
                                        {option.hours}
                                    </Text>
                                </View>
                            </View>

                            {/* Selection Indicator */}
                            <View style={styles.indicatorContainer}>
                                <View style={[
                                    styles.radioButton,
                                    selectedIndex === index && styles.radioButtonSelected
                                ]}>
                                    {selectedIndex === index && (
                                        <View style={styles.radioButtonInner} />
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Spacer for bottom padding */}
                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Fixed Continue Button at Bottom */}
            <View style={styles.footerContainer}>
                <ContinueButton
                    onPress={handleContinue}
                    style={styles.continueButtonStyle}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F5F0',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 20, // Extra padding at bottom
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
        marginBottom: 40,
        color: '#5D4037',
        lineHeight: 40,
    },
    selectionContainer: {
        paddingVertical: 20,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    selectedCard: {
        borderColor: '#5D4037',
        backgroundColor: '#FFF8F5',
        shadowOpacity: 0.15,
        elevation: 5,
    },
    emojiContainer: {
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    qualityLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: '#BDBDBD',
        marginBottom: 6,
    },
    selectedLabel: {
        color: '#5D4037',
    },
    hoursContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hoursText: {
        fontSize: 14,
        color: '#BDBDBD',
        marginLeft: 6,
        fontWeight: '500',
    },
    selectedHoursText: {
        color: '#5D4037',
    },
    indicatorContainer: {
        marginLeft: 16,
    },
    radioButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#BDBDBD',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: '#5D4037',
    },
    radioButtonInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#5D4037',
    },
    bottomSpacer: {
        height: 20, // Extra space at bottom
    },
    footerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 30,
        paddingTop: 20,
        backgroundColor: '#F8F5F0',
        borderTopWidth: 1,
        borderTopColor: '#E8DDD9',
    },
    continueButtonStyle: {
        marginVertical: 0,
    },
});

export default SleepSelection;