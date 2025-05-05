import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Dimensions,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import { useAssessmentStore } from '@/src/store/Store';
import ContinueButton from '@/src/components/Continue';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const MARKER_WIDTH = 2;
const MARKER_SPACING = 15; // Keep original spacing
const MIN_WEIGHT = 40;
const MAX_WEIGHT = 200;
const TOTAL_WEIGHTS = MAX_WEIGHT - MIN_WEIGHT + 1;
const WEIGHT_OFFSET = -14; // Add offset between ruler and displayed weight

const WeightSelection: React.FC = () => {
    // We'll store the ruler value and calculate display value with offset
    const [rulerWeight, setRulerWeight] = useState<number>(70 - WEIGHT_OFFSET); // Default adjusted for offset
    const [unit, setUnit] = useState<'kg' | 'lbs'>('kg');
    const navigation = useNavigation<NavigationProp>();
    const scrollViewRef = useRef<ScrollView>(null);

    // Track if the first render has completed
    const initialRenderComplete = useRef(false);

    // Keep track of if we should update weight on scroll
    const shouldUpdateWeight = useRef(true);

    // Get the setWeight action from Zustand store
    const updateWeightInStore = useAssessmentStore(state => state.setWeight);

    // Get display weight (ruler weight + offset)
    const getDisplayWeight = (rWeight: number): number => {
        return rWeight + WEIGHT_OFFSET;
    };

    // Get ruler weight from display weight
    const getRulerWeight = (dWeight: number): number => {
        return dWeight - WEIGHT_OFFSET;
    };

    // Convert kg to lbs and vice versa
    const convertWeight = (value: number, fromUnit: 'kg' | 'lbs', toUnit: 'kg' | 'lbs'): number => {
        if (fromUnit === toUnit) return value;

        if (fromUnit === 'kg' && toUnit === 'lbs') {
            return Math.round(value * 2.20462);
        } else {
            return Math.round(value / 2.20462);
        }
    };

    // Display weight with offset applied
    const displayWeight = unit === 'kg'
        ? getDisplayWeight(rulerWeight)
        : convertWeight(getDisplayWeight(rulerWeight), 'kg', 'lbs');

    // Calculate scroll position from weight
    const getScrollPositionFromWeight = (rWeight: number): number => {
        return (rWeight - MIN_WEIGHT) * MARKER_SPACING - (width / 2) + MARKER_SPACING;
    };

    // Calculate weight from scroll position
    const getWeightFromScrollPosition = (scrollPosition: number): number => {
        const centerPositionX = scrollPosition + (width / 2);
        const markerIndex = Math.round(centerPositionX / MARKER_SPACING);
        return MIN_WEIGHT + markerIndex;
    };

    // Scroll to specific weight
    const scrollToWeight = (rWeight: number, animated: boolean = true) => {
        if (!scrollViewRef.current) return;

        shouldUpdateWeight.current = false; // Prevent weight updates during programmatic scrolling

        const position = getScrollPositionFromWeight(rWeight);
        scrollViewRef.current.scrollTo({ x: position, animated });

        // Re-enable weight updates after scrolling completes
        setTimeout(() => {
            shouldUpdateWeight.current = true;
        }, animated ? 300 : 50);
    };

    // Initialize the slider position
    useEffect(() => {
        // Only run this once after first render
        if (!initialRenderComplete.current) {
            setTimeout(() => {
                scrollToWeight(rulerWeight, false);
                initialRenderComplete.current = true;
            }, 300);
        }
    }, []);

    // Handle unit change
    useEffect(() => {
        if (initialRenderComplete.current) {
            // When unit changes, keep ruler at same position
            scrollToWeight(rulerWeight);
        }
    }, [unit]);

    // Handle scrolling and update weight
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!shouldUpdateWeight.current) return;

        const offsetX = event.nativeEvent.contentOffset.x;
        const calculatedRulerWeight = getWeightFromScrollPosition(offsetX);

        if (calculatedRulerWeight >= MIN_WEIGHT && calculatedRulerWeight <= MAX_WEIGHT) {
            setRulerWeight(calculatedRulerWeight);
        }
    };

    // Handle scroll end to snap to nearest marker
    const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // Get the exact weight at current scroll position
        const offsetX = event.nativeEvent.contentOffset.x;
        const calculatedRulerWeight = getWeightFromScrollPosition(offsetX);

        if (calculatedRulerWeight >= MIN_WEIGHT && calculatedRulerWeight <= MAX_WEIGHT) {
            setRulerWeight(calculatedRulerWeight);
            scrollToWeight(calculatedRulerWeight);
        }
    };

    // Change unit handler
    const handleUnitChange = (newUnit: 'kg' | 'lbs') => {
        if (unit !== newUnit) {
            setUnit(newUnit);
        }
    };

    // Continue handler
    const handleContinue = async () => {
        try {
            // Store the DISPLAY weight (with offset)
            const saveWeight = getDisplayWeight(rulerWeight);

            if (unit === 'kg') {
                updateWeightInStore(saveWeight, 'kg');
            } else {
                // For lbs, convert the display weight
                const weightInLbs = convertWeight(saveWeight, 'kg', 'lbs');
                updateWeightInStore(weightInLbs, 'lbs');
            }

            // Navigate to next screen
            navigation.navigate('HeightSelection');
        } catch (error) {
            console.error('Error saving weight:', error);
        }
    };

    // Generate ruler markers
    const renderRulerMarkers = () => {
        const markers = [];
        const paddingWidth = width / 2; // Add padding on each side for better scrolling

        // Left padding
        markers.push(
            <View key="left-padding" style={{ width: paddingWidth }} />
        );

        // Generate markers for each weight value
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
                        }
                    ]}
                >
                    {isMainMarker && (
                        <Text style={styles.markerText}>
                            {markerWeight}
                        </Text>
                    )}
                </View>
            );
        }

        // Right padding
        markers.push(
            <View key="right-padding" style={{ width: paddingWidth }} />
        );

        return markers;
    };
    return (
        <View style={styles.outerContainer}>
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

                {/* Main Content Container */}
                <View style={styles.contentContainer}>
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
                        <Text style={styles.weightText}>{displayWeight}</Text>
                        <Text style={styles.unitText}>{unit}</Text>
                    </View>

                    {/* Weight Ruler */}
                    <View style={styles.rulerContainer}>
                        {/* Center Indicator */}
                        <View style={styles.centerIndicator} />

                        {/* ScrollView-based ruler */}
                        <ScrollView
                            ref={scrollViewRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.rulerScrollContent}
                            onScroll={handleScroll}
                            onScrollEndDrag={handleScrollEnd}
                            onMomentumScrollEnd={handleScrollEnd}
                            scrollEventThrottle={16}
                            decelerationRate="fast"
                        >
                            <View style={styles.rulerContent}>
                                {renderRulerMarkers()}
                            </View>
                        </ScrollView>
                    </View>

                    {/* Flexible spacer to push content up and footer down */}
                    <View style={styles.flexSpacer} />
                </View>
            </SafeAreaView>

            {/* Footer with Continue Button - Outside SafeAreaView for consistent positioning */}
            <SafeAreaView style={styles.footerSafeArea}>
                <View style={styles.footerContainer}>
                    <ContinueButton onPress={handleContinue} />
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    flexSpacer: {
        flex: 1,
        minHeight: 20,
    },
    footerSafeArea: {
        backgroundColor: '#FFFFFF',
    },
    footerContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
        backgroundColor: '#FFFFFF',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    // All other styles remain the same
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
    rulerScrollContent: {
        paddingVertical: 20,
    },
    rulerContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 150,
    },
    marker: {
        width: MARKER_WIDTH,
        backgroundColor: '#D8C3B5',
        marginHorizontal: (MARKER_SPACING - MARKER_WIDTH) / 2,
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
});

export default WeightSelection;