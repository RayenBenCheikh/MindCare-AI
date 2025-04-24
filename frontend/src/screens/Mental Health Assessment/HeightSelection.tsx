import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Animated,
    PanResponder,
    Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const RULER_WIDTH = width * 0.9;
const MARKER_WIDTH = 2;
const MARKER_SPACING = 15;
const MIN_HEIGHT_CM = 100;
const MAX_HEIGHT_CM = 220;
const MIN_HEIGHT_FT = 3;  // 3'0"
const MAX_HEIGHT_FT = 7;  // 7'3"
const TOTAL_HEIGHTS_CM = MAX_HEIGHT_CM - MIN_HEIGHT_CM + 1;

const HeightSelection: React.FC = () => {
    const [height, setHeight] = useState<number>(170); // Default height 170cm
    const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
    const navigation = useNavigation<NavigationProp>();
    const scrollX = useRef(new Animated.Value(0)).current;
    const startScrollX = useRef(0);

    // Convert height between cm and feet/inches
    const convertHeight = (heightVal: number, fromUnit: 'cm' | 'ft', toUnit: 'cm' | 'ft') => {
        if (fromUnit === toUnit) return heightVal;

        if (fromUnit === 'cm' && toUnit === 'ft') {
            // Convert cm to total inches, then convert to feet and inches
            const totalInches = heightVal / 2.54;
            const feet = Math.floor(totalInches / 12);
            const inches = Math.round(totalInches % 12);
            // Return in special format for display: feet * 100 + inches
            return feet * 100 + inches;
        } else {
            // Convert from feet/inches format to cm
            const feet = Math.floor(heightVal / 100);
            const inches = heightVal % 100;
            const totalInches = feet * 12 + inches;
            return Math.round(totalInches * 2.54);
        }
    };

    // Format height for display
    const formatHeightForDisplay = (heightVal: number) => {
        if (unit === 'cm') {
            return heightVal;
        } else {
            const feet = Math.floor(heightVal / 100);
            const inches = heightVal % 100;
            return `${feet}'${inches}"`;
        }
    };

    // Initialize the slider position
    const initialOffset = (height - MIN_HEIGHT_CM) * MARKER_SPACING;
    scrollX.setValue(-initialOffset);

    // Set up pan responder for slider
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                scrollX.addListener(({ value }) => {
                    startScrollX.current = value;
                });
            },
            onPanResponderMove: (_, gestureState) => {
                const newPosition = startScrollX.current + gestureState.dx;
                const minPosition = -(TOTAL_HEIGHTS_CM - 1) * MARKER_SPACING;
                const maxPosition = 0;

                const boundedPosition = Math.max(minPosition, Math.min(newPosition, maxPosition));
                scrollX.setValue(boundedPosition);

                // Update height based on position
                const calculatedHeight = MIN_HEIGHT_CM - Math.round(boundedPosition / MARKER_SPACING);
                if (calculatedHeight !== height && unit === 'cm') {
                    setHeight(calculatedHeight);
                } else if (unit === 'ft') {
                    // Converting the cm value to feet/inches
                    const feetInchFormat = convertHeight(calculatedHeight, 'cm', 'ft');
                    if (feetInchFormat !== height) {
                        setHeight(feetInchFormat);
                    }
                }
            },
            onPanResponderRelease: () => { },
        })
    ).current;

    // Change unit handler
    const handleUnitChange = (newUnit: 'cm' | 'ft') => {
        if (unit !== newUnit) {
            const newHeight = convertHeight(height, unit, newUnit);
            setHeight(newHeight);
            setUnit(newUnit);
        }
    };

    // Continue handler
    const handleContinue = async () => {
        try {
            // Store height in AsyncStorage
            if (unit === 'cm') {
                await AsyncStorage.setItem('userHeight', height.toString());
                await AsyncStorage.setItem('userHeightUnit', 'cm');
            } else {
                // Store both the feet-inch format and the cm equivalent
                await AsyncStorage.setItem('userHeight', height.toString());
                await AsyncStorage.setItem('userHeightUnit', 'ft');
                const cmHeight = convertHeight(height, 'ft', 'cm');
                await AsyncStorage.setItem('userHeightCm', cmHeight.toString());
            }

            // Navigate to next screen
            navigation.navigate('MoodSelection');
        } catch (error) {
            console.error('Error saving height:', error);
        }
    };

    // Generate ruler markers
    const renderRulerMarkers = () => {
        const markers = [];

        for (let i = 0; i <= TOTAL_HEIGHTS_CM; i++) {
            const markerHeight = MIN_HEIGHT_CM + i;
            const isMainMarker = i % 5 === 0;

            markers.push(
                <View
                    key={i}
                    style={[
                        styles.marker,
                        {
                            height: isMainMarker ? 40 : 20,
                            opacity: isMainMarker ? 1 : 0.5,
                            left: i * MARKER_SPACING
                        }
                    ]}
                >
                    {isMainMarker && (
                        <Text style={styles.markerText}>
                            {unit === 'cm'
                                ? markerHeight
                                : formatHeightForDisplay(convertHeight(markerHeight, 'cm', 'ft'))}
                        </Text>
                    )}
                </View>
            );
        }

        return markers;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Assessment</Text>
                <View style={styles.progressPill}>
                    <Text style={styles.progressText}>5 of 14</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>What's your height?</Text>

            {/* Unit Selector */}
            <View style={styles.unitSelectorContainer}>
                <TouchableOpacity
                    style={[
                        styles.unitButton,
                        unit === 'cm' && styles.activeUnitButton
                    ]}
                    onPress={() => handleUnitChange('cm')}
                >
                    <Text style={[
                        styles.unitButtonText,
                        unit === 'cm' && styles.activeUnitButtonText
                    ]}>cm</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.unitButton,
                        unit === 'ft' && styles.activeUnitButton
                    ]}
                    onPress={() => handleUnitChange('ft')}
                >
                    <Text style={[
                        styles.unitButtonText,
                        unit === 'ft' && styles.activeUnitButtonText
                    ]}>ft</Text>
                </TouchableOpacity>
            </View>

            {/* Height Display */}
            <View style={styles.heightDisplayContainer}>
                <Text style={styles.heightText}>
                    {unit === 'cm' ? height : Math.floor(height / 100)}
                </Text>
                {unit === 'ft' && (
                    <Text style={styles.inchesText}>{height % 100}"</Text>
                )}
                {unit === 'cm' && (
                    <Text style={styles.unitText}>{unit}</Text>
                )}
            </View>

            {/* Height Ruler */}
            <View style={styles.rulerContainer}>
                <Animated.View
                    style={[
                        styles.rulerContent,
                        {
                            transform: [{ translateX: scrollX }]
                        }
                    ]}
                    {...panResponder.panHandlers}
                >
                    {renderRulerMarkers()}
                </Animated.View>

                {/* Center Indicator */}
                <View style={styles.centerIndicator} />
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
    unitSelectorContainer: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 30,
        marginHorizontal: 30,
        marginBottom: 50,
        overflow: 'hidden',
    },
    unitButton: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        borderRadius: 30,
    },
    activeUnitButton: {
        backgroundColor: '#E18942',
    },
    unitButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#5D4037',
        opacity: 0.6,
    },
    activeUnitButtonText: {
        color: '#FFFFFF',
        opacity: 1,
    },
    heightDisplayContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 50,
    },
    heightText: {
        fontSize: 120,
        fontWeight: 'bold',
        color: '#5D4037',
        lineHeight: 130,
    },
    inchesText: {
        fontSize: 60,
        fontWeight: 'bold',
        color: '#5D4037',
        marginBottom: 25,
    },
    unitText: {
        fontSize: 40,
        color: '#5D4037',
        marginBottom: 15,
        marginLeft: 10,
    },
    rulerContainer: {
        height: 150,
        marginHorizontal: -20,
        alignItems: 'center',
        position: 'relative',
    },
    rulerContent: {
        height: 150,
        position: 'absolute',
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    marker: {
        width: MARKER_WIDTH,
        backgroundColor: '#D8C3B5',
        position: 'absolute',
        bottom: 40,
    },
    markerText: {
        position: 'absolute',
        bottom: -25,
        left: -10,
        width: 30,
        textAlign: 'center',
        color: '#D8C3B5',
        fontSize: 16,
    },
    centerIndicator: {
        position: 'absolute',
        width: 8,
        height: 50,
        backgroundColor: '#8DAA6D',
        borderRadius: 4,
        bottom: 40,
        zIndex: 10,
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

export default HeightSelection;