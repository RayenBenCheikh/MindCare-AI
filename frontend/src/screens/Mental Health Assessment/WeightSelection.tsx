import React, { useState, useRef, useEffect } from 'react';
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
import { useAssessmentStore } from '@/src/store/Store';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const RULER_WIDTH = width * 0.9;
const MARKER_WIDTH = 2;
const MARKER_SPACING = 15;
const MIN_WEIGHT = 40;
const MAX_WEIGHT = 200;
const TOTAL_WEIGHTS = MAX_WEIGHT - MIN_WEIGHT + 1;
const VISIBLE_WEIGHTS = 5; // Number of weights visible in the ruler
const updateWeight = useAssessmentStore(state => state.setWeight);
const WeightSelection: React.FC = () => {
    const [weight, setWeight] = useState<number>(128);
    const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
    const navigation = useNavigation<NavigationProp>();
    const scrollX = useRef(new Animated.Value(0)).current;
    const scrollXValue = useRef(0);
    const startScrollX = useRef(0);
    const animationIsRunning = useRef(false);
    const updateWeightInStore = useAssessmentStore(state => state.setWeight);

    // Add listener to track scrollX value
    useEffect(() => {
        const scrollListener = scrollX.addListener(({ value }) => {
            scrollXValue.current = value;
        });

        // Initial position setup
        const initialOffset = -(weight - MIN_WEIGHT) * MARKER_SPACING;
        scrollX.setValue(initialOffset);
        scrollXValue.current = initialOffset;

        return () => {
            scrollX.removeListener(scrollListener);
        };
    }, []);

    // Convert kg to lbs and vice versa
    const convertWeight = (weight: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs') => {
        if (fromUnit === toUnit) return weight;
        return fromUnit === 'kg'
            ? Math.round(weight * 2.20462)
            : Math.round(weight / 2.20462);
    };

    // Update weight when unit changes
    useEffect(() => {
        const offset = -scrollXValue.current;
        const calculatedWeight = MIN_WEIGHT + Math.round(offset / MARKER_SPACING);
        if (calculatedWeight !== weight && calculatedWeight >= MIN_WEIGHT && calculatedWeight <= MAX_WEIGHT) {
            setWeight(calculatedWeight);
        }
    }, [unit]);

    // Set up pan responder for slider
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                // Store current position using our ref value
                startScrollX.current = scrollXValue.current;
                animationIsRunning.current = false;
            },
            onPanResponderMove: (_, gestureState) => {
                if (animationIsRunning.current) return;

                const newPosition = startScrollX.current + gestureState.dx;
                const minPosition = -(MAX_WEIGHT - MIN_WEIGHT) * MARKER_SPACING;
                const maxPosition = 0;

                // Bound the position
                const boundedPosition = Math.min(maxPosition, Math.max(minPosition, newPosition));
                scrollX.setValue(boundedPosition);

                // Calculate weight based on position with bounds checking
                const offset = -boundedPosition;
                const calculatedWeight = MIN_WEIGHT + Math.round(offset / MARKER_SPACING);

                // Update weight if it's different and within bounds
                if (calculatedWeight !== weight &&
                    calculatedWeight >= MIN_WEIGHT &&
                    calculatedWeight <= MAX_WEIGHT) {
                    setWeight(calculatedWeight);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                // Snap to nearest weight marker
                const currentPosition = scrollXValue.current;
                const targetWeight = Math.round(
                    MIN_WEIGHT - currentPosition / MARKER_SPACING
                );
                const clampedWeight = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, targetWeight));
                const snapToPosition = -(clampedWeight - MIN_WEIGHT) * MARKER_SPACING;

                // Animate to the snapped position
                animationIsRunning.current = true;
                Animated.spring(scrollX, {
                    toValue: snapToPosition,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }).start(() => {
                    animationIsRunning.current = false;
                    setWeight(clampedWeight);
                });
            },
        })
    ).current;


    // Change unit handler
    const handleUnitChange = (newUnit: 'kg' | 'lbs') => {
        if (unit !== newUnit) {
            const newWeight = convertWeight(weight, unit, newUnit);
            setWeight(newWeight);
            setUnit(newUnit);
        }
    };

    // Continue handler
    const handleContinue = async () => {
        try {
            // Save weight to Zustand store
            updateWeightInStore(weight, unit);
            // Navigate to next screen
            navigation.navigate('HeigherSelection'); // Replace with your next screen name
        } catch (error) {
            console.error('Error saving weight:', error);
        }
    };

    // Generate ruler markers
    const renderRulerMarkers = () => {
        const markers = [];

        for (let i = 0; i <= TOTAL_WEIGHTS; i++) {
            const markerWeight = MIN_WEIGHT + i;
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
                        <Text style={styles.markerText}>{markerWeight}</Text>
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
                    <Text style={styles.progressText}>4 of 10</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>What's your weight?</Text>

            {/* Unit Selector */}
            <View style={styles.unitSelectorContainer}>
                <TouchableOpacity
                    style={[
                        styles.unitButton,
                        unit === 'kg' && styles.activeUnitButton
                    ]}
                    onPress={() => handleUnitChange('kg')}
                >
                    <Text style={[
                        styles.unitButtonText,
                        unit === 'kg' && styles.activeUnitButtonText
                    ]}>kg</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.unitButton,
                        unit === 'lbs' && styles.activeUnitButton
                    ]}
                    onPress={() => handleUnitChange('lbs')}
                >
                    <Text style={[
                        styles.unitButtonText,
                        unit === 'lbs' && styles.activeUnitButtonText
                    ]}>lbs</Text>
                </TouchableOpacity>
            </View>

            {/* Weight Display */}
            <View style={styles.weightDisplayContainer}>
                <Text style={styles.weightText}>{weight}</Text>
                <Text style={styles.unitText}>{unit}</Text>
            </View>

            {/* Weight Ruler */}
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
    weightDisplayContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'flex-end',
        marginBottom: 50,
    },
    weightText: {
        fontSize: 120,
        fontWeight: 'bold',
        color: '#5D4037',
        lineHeight: 130,
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

export default WeightSelection;