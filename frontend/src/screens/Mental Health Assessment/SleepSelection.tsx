import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    Animated,
    PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SvgXml } from 'react-native-svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

const sleepOptions = [
    { label: 'Excellent', hours: '7-9 HOURS', color: '#9CCC65', emoji: '😊' },
    { label: 'Good', hours: '6-7 HOURS', color: '#FFD54F', emoji: '🙂' },
    { label: 'Fair', hours: '5 HOURS', color: '#D7CCC8', emoji: '😐' },
    { label: 'Poor', hours: '3-4 HOURS', color: '#F39C12', emoji: '😟' },
    { label: 'Worst', hours: '<3 HOURS', color: '#7986CB', emoji: '😢' },
];

const SleepSelection: React.FC = () => {
    const [selectedIndex, setSelectedIndex] = useState(3); // Default to "Poor"
    const navigation = useNavigation<NavigationProp>();
    const translateY = useRef(new Animated.Value(0)).current;
    const currentYValue = useRef(0); // Store current Y value
    const sliderHeight = height * 0.45; // Adjusted height for better spacing
    const itemHeight = sliderHeight / (sleepOptions.length - 1);

    // Set up initial position and value listener
    useEffect(() => {
        // Set initial position
        translateY.setValue(selectedIndex * itemHeight);
        currentYValue.current = selectedIndex * itemHeight;

        // Set up listener to track current value
        const id = translateY.addListener(({ value }) => {
            currentYValue.current = value;
        });

        // Clean up listener on unmount
        return () => {
            translateY.removeListener(id);
        };
    }, []);

    // Create icon components for the sleep quality options
    const renderEmojiIcon = (index: number) => {
        const option = sleepOptions[index];
        return (
            <View style={[styles.emojiContainer, { backgroundColor: option.color }]}>
                <Text style={styles.emoji}>{option.emoji}</Text>
            </View>
        );
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gestureState) => {
            const newY = Math.min(
                Math.max(gestureState.dy + currentYValue.current, 0),
                sliderHeight
            );
            translateY.setValue(newY);
        },
        onPanResponderRelease: (_, gestureState) => {
            // Calculate nearest index position
            const newIndex = Math.round(currentYValue.current / itemHeight);
            const clampedIndex = Math.min(Math.max(newIndex, 0), sleepOptions.length - 1);

            // Animate to the nearest position
            setSelectedIndex(clampedIndex);
            Animated.spring(translateY, {
                toValue: clampedIndex * itemHeight,
                tension: 50,
                friction: 10,
                useNativeDriver: true,
            }).start();
        },
    });
    // Function to handle the continue button press
    const handleContinue = async () => {
        try {
            const selectedOption = sleepOptions[selectedIndex];
            // Save selection to AsyncStorage
            await AsyncStorage.setItem('sleepQuality', selectedOption.label);
            await AsyncStorage.setItem('sleepHours', selectedOption.hours);

            // Navigate to the next screen
            navigation.navigate('HelpSelection'); // Update to your actual next screen
        } catch (error) {
            console.error('Error saving sleep quality:', error);
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
                    <Text style={styles.progressText}>8 of 14</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>
                How would you rate your sleep quality?
            </Text>

            {/* Sleep Quality Options */}
            <View style={styles.sliderContainer}>
                {/* Sleep Quality Labels and Hours */}
                <View style={styles.labelsContainer}>
                    {sleepOptions.map((option, index) => (
                        <View
                            key={index}
                            style={[
                                styles.labelRow,
                                { marginBottom: index < sleepOptions.length - 1 ? itemHeight - 30 : 0 }
                            ]}
                        >
                            <Text
                                style={[
                                    styles.labelText,
                                    selectedIndex === index && styles.selectedLabelText
                                ]}
                            >
                                {option.label}
                            </Text>
                            <View style={styles.hoursContainer}>
                                <SvgXml
                                    xml={`<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="#BDBDBD" stroke-width="2"/>
                                        <path d="M12 6V12L16 16" stroke="#BDBDBD" stroke-width="2" stroke-linecap="round"/>
                                    </svg>`}
                                    width={16}
                                    height={16}
                                />
                                <Text
                                    style={[
                                        styles.hoursText,
                                        selectedIndex === index && styles.selectedHoursText
                                    ]}
                                >
                                    {option.hours}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Slider Track and Thumb */}
                <View style={styles.sliderTrackContainer}>
                    {/* Vertical track */}
                    <View style={styles.sliderTrack}>
                        {/* Orange Indicator Line */}
                        <Animated.View
                            style={[
                                styles.sliderIndicator,
                                {
                                    height: translateY,
                                    backgroundColor: '#F39C12',
                                }
                            ]}
                        />
                    </View>

                    {/* Draggable Thumb */}
                    <Animated.View
                        {...panResponder.panHandlers}
                        style={[
                            styles.sliderThumb,
                            {
                                backgroundColor: sleepOptions[selectedIndex].color,
                                transform: [{ translateY }],
                            },
                        ]}
                    >
                        <View style={styles.thumbInner}>
                            {/* This is the refresh/sync icon in the thumb */}
                            <SvgXml
                                xml={`<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 11C19.7554 9.24017 18.9391 7.60461 17.6766 6.35384C16.4142 5.10307 14.7758 4.30258 13.0137 4.07647C11.2516 3.85036 9.46362 4.20726 7.9252 5.09748C6.38678 5.98769 5.18325 7.36526 4.5 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M4 4V9H9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M4 13C4.24456 14.7598 5.06093 16.3954 6.32336 17.6462C7.58579 18.8969 9.22424 19.6974 10.9863 19.9235C12.7484 20.1496 14.5364 19.7927 16.0748 18.9025C17.6132 18.0123 18.8168 16.6347 19.5 15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M20 20V15H15" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>`}
                                width={20}
                                height={20}
                            />
                        </View>
                    </Animated.View>
                </View>

                {/* Emoji Icons */}
                <View style={styles.emojisContainer}>
                    {sleepOptions.map((option, index) => (
                        <View
                            key={index}
                            style={[
                                styles.emojiRow,
                                { marginBottom: index < sleepOptions.length - 1 ? itemHeight - 30 : 0 }
                            ]}
                        >
                            {renderEmojiIcon(index)}
                        </View>
                    ))}
                </View>
            </View>

            {/* Continue Button */}
            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
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
        marginBottom: 40,
        color: '#5D4037',
        lineHeight: 40,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginTop: 30,
        flex: 1,
    },
    labelsContainer: {
        flex: 1,
        justifyContent: 'space-between',
    },
    labelRow: {
        flexDirection: 'column',
        alignItems: 'flex-start',
    },
    labelText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#BDBDBD',
        marginBottom: 5,
    },
    selectedLabelText: {
        color: '#5D4037',
    },
    hoursContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    hoursText: {
        fontSize: 14,
        color: '#BDBDBD',
        marginLeft: 4,
    },
    selectedHoursText: {
        color: '#5D4037',
    },
    sliderTrackContainer: {
        width: 8,
        height: height * 0.45,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginHorizontal: 20,
    },
    sliderTrack: {
        width: 8,
        height: '100%',
        backgroundColor: '#F5F5F5',
        borderRadius: 4,
        overflow: 'hidden',
    },
    sliderIndicator: {
        width: 8,
        position: 'absolute',
        bottom: 0,
        borderRadius: 4,
    },
    sliderThumb: {
        width: 60,
        height: 60,
        borderRadius: 30,
        position: 'absolute',
        top: -30,
        left: -26,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    thumbInner: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojisContainer: {
        justifyContent: 'space-between',
    },
    emojiRow: {
        alignItems: 'center',
    },
    emojiContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emoji: {
        fontSize: 24,
    },
    continueButton: {
        backgroundColor: '#5D4037',
        padding: 18,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
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

export default SleepSelection;