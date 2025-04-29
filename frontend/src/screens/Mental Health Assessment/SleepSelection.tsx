import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Dimensions,
    Animated,
    PanResponder,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import { useAssessmentStore } from '@/src/store/Store';
import { SvgXml } from 'react-native-svg';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width, height } = Dimensions.get('window');

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
    const [selectedIndex, setSelectedIndex] = useState(3); // Default to "Poor"
    const navigation = useNavigation<NavigationProp>();
    const translateY = useRef(new Animated.Value(0)).current;
    const currentYValue = useRef(0);
    const sliderHeight = height * 0.5;
    const itemHeight = sliderHeight / (sleepOptions.length - 1);
    const previousIndex = useRef(selectedIndex);
    const setSleepQuality = useAssessmentStore(state => state.setSleepQuality);

    // Set up initial position and value listener
    useEffect(() => {
        const initialPosition = selectedIndex * itemHeight;
        translateY.setValue(initialPosition);
        currentYValue.current = initialPosition;

        const id = translateY.addListener(({ value }) => {
            currentYValue.current = value;
        });

        return () => {
            translateY.removeListener(id);
        };
    }, []);

    // Handle navigation when selection changes
    useEffect(() => {
        // Only navigate if this isn't the initial render and index actually changed
        if (previousIndex.current !== selectedIndex && previousIndex.current !== -1) {
            handleSelectionComplete();
        }
        previousIndex.current = selectedIndex;
    }, [selectedIndex]);

    // Calculate the percentage filled for slider
    const filledPercentage = translateY.interpolate({
        inputRange: [0, sliderHeight],
        outputRange: [0, 1],
        extrapolate: 'clamp'
    });

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderMove: (_, gestureState) => {
                const newY = Math.min(
                    Math.max(0, currentYValue.current + gestureState.dy),
                    sliderHeight
                );
                translateY.setValue(newY);
            },
            onPanResponderRelease: () => {
                // Calculate nearest index position
                const newIndex = Math.round(currentYValue.current / itemHeight);
                const clampedIndex = Math.min(Math.max(newIndex, 0), sleepOptions.length - 1);

                // Animate to the nearest position
                Animated.spring(translateY, {
                    toValue: clampedIndex * itemHeight,
                    tension: 50,
                    friction: 10,
                    useNativeDriver: true,
                }).start(() => {
                    // Only update selected index if it's different
                    if (selectedIndex !== clampedIndex) {
                        setSelectedIndex(clampedIndex);
                    }
                });
            },
        })
    ).current;

    const handleSelectionComplete = async () => {
        try {
            const selectedOption = sleepOptions[selectedIndex];
            // Use Zustand store instead of AsyncStorage
            setSleepQuality(selectedOption.label, selectedOption.hours);
            // Add a small delay before navigation for better UX
            setTimeout(() => {
                navigation.navigate('HelpSelection');
            }, 300);
        } catch (error) {
            console.error('Error saving sleep quality:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
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
                {/* Sleep Quality Labels */}
                <View style={styles.labelsColumn}>
                    {sleepOptions.map((option, index) => (
                        <View
                            key={`label-${index}`}
                            style={[
                                styles.labelContainer,
                                {
                                    marginTop: index === 0 ? 0 : itemHeight - 36,
                                    opacity: selectedIndex === index ? 1 : 0.5
                                }
                            ]}
                        >
                            <Text style={[
                                styles.qualityLabel,
                                selectedIndex === index ? styles.selectedLabel : {}
                            ]}>
                                {option.label}
                            </Text>
                            <View style={styles.hoursContainer}>
                                <SvgXml
                                    xml={`<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="${selectedIndex === index ? '#5D4037' : '#BDBDBD'}" stroke-width="2"/>
                                        <path d="M12 6V12L16 16" stroke="${selectedIndex === index ? '#5D4037' : '#BDBDBD'}" stroke-width="2" stroke-linecap="round"/>
                                    </svg>`}
                                    width={16}
                                    height={16}
                                />
                                <Text style={[
                                    styles.hoursText,
                                    selectedIndex === index ? styles.selectedHoursText : {}
                                ]}>
                                    {option.hours}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Slider */}
                <View style={styles.sliderColumn}>
                    {/* Background Track */}
                    <View style={styles.sliderTrack} />

                    <View style={styles.sliderFillContainer}>
                        <Animated.View
                            style={[
                                styles.sliderFill,
                                {
                                    transform: [{
                                        scaleY: filledPercentage,
                                    }]
                                }
                            ]}
                        />
                    </View>

                    {/* Thumb - draggable handle */}
                    <Animated.View
                        style={[
                            styles.sliderThumb,
                            {
                                transform: [{ translateY }]
                            }
                        ]}
                        {...panResponder.panHandlers}
                    >
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
                    </Animated.View>
                </View>

                {/* Emoji Column */}
                <View style={styles.emojisColumn}>
                    {sleepOptions.map((option, index) => (
                        <View
                            key={`emoji-${index}`}
                            style={[
                                styles.emojiContainer,
                                {
                                    marginTop: index === 0 ? 0 : itemHeight - 36,
                                    opacity: selectedIndex === index ? 1 : 0.5
                                }
                            ]}
                        >
                            <SvgXml xml={option.emojiSvg} width={36} height={36} />
                        </View>
                    ))}
                </View>
            </View>

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
        marginBottom: 60,
        color: '#5D4037',
        lineHeight: 40,
    },
    selectionContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    labelsColumn: {
        flex: 1.2,
        justifyContent: 'flex-start',
    },
    sliderColumn: {
        width: 4,
        marginHorizontal: 30,
        alignItems: 'center',
        justifyContent: 'flex-start',
        height: '100%',
    },
    emojisColumn: {
        flex: 0.8,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
    },
    labelContainer: {
        alignItems: 'flex-start',
    },
    qualityLabel: {
        fontSize: 24,
        fontWeight: '500',
        color: '#BDBDBD',
        marginBottom: 4,
    },
    selectedLabel: {
        color: '#5D4037',
        fontWeight: '600',
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
    sliderTrack: {
        position: 'absolute',
        top: 0,
        height: '100%',
        width: 4,
        backgroundColor: '#ECECEC',
        borderRadius: 2,
    },
    sliderFillContainer: {
        position: 'absolute',
        bottom: 0,
        width: 4,
        height: '100%',
        overflow: 'hidden',
    },
    sliderFill: {
        position: 'absolute',
        bottom: 0,
        width: 4,
        height: '100%',
        backgroundColor: '#F39C12',
        borderRadius: 2,
        transformOrigin: 'bottom',
    },
    sliderThumb: {
        position: 'absolute',
        top: -30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F39C12',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    emojiContainer: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    continueButton: {
        backgroundColor: '#5D4037',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 30,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
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