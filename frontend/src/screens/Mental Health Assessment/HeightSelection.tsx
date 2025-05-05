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
const MARKER_SPACING = 15;
const HEIGHT_OFFSET = -14;
const MIN_HEIGHT_CM = 100;
const MAX_HEIGHT_CM = 220;
const TOTAL_HEIGHTS_CM = MAX_HEIGHT_CM - MIN_HEIGHT_CM + 1;

const HeightSelection: React.FC = () => {
    // We'll keep the ruler value in heightRulerValue and the display value in heightValue
    const [heightRulerValue, setHeightRulerValue] = useState<number>(150); // Default height 150cm (shows as 170cm)
    const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
    const navigation = useNavigation<NavigationProp>();
    const scrollViewRef = useRef<ScrollView>(null);

    // Track if the first render has completed
    const initialRenderComplete = useRef(false);

    // Keep track of if we should update height on scroll
    const shouldUpdateHeight = useRef(true);

    // Get the setHeight action from Zustand store
    const updateHeightInStore = useAssessmentStore(state => state.setHeight);

    // Get the display height (ruler height + offset)
    const getDisplayHeight = (rulerHeight: number): number => {
        return rulerHeight + HEIGHT_OFFSET;
    };

    // Get the real height without offset
    const getRulerHeight = (displayHeight: number): number => {
        return displayHeight - HEIGHT_OFFSET;
    };

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

    // Calculate the displayed height value
    const displayedHeight = unit === 'cm'
        ? getDisplayHeight(heightRulerValue)
        : convertHeight(getDisplayHeight(heightRulerValue), 'cm', 'ft');

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

    // Calculate scroll position from height
    const getScrollPositionFromHeight = (height: number): number => {
        return (height - MIN_HEIGHT_CM) * MARKER_SPACING - (width / 2) + MARKER_SPACING;
    };

    // Calculate height from scroll position
    const getHeightFromScrollPosition = (scrollPosition: number): number => {
        const centerPositionX = scrollPosition + (width / 2);
        const markerIndex = Math.round(centerPositionX / MARKER_SPACING);
        return MIN_HEIGHT_CM + markerIndex;
    };

    // Scroll to specific height
    const scrollToHeight = (height: number, animated: boolean = true) => {
        if (!scrollViewRef.current) return;

        shouldUpdateHeight.current = false; // Prevent height updates during programmatic scrolling

        const position = getScrollPositionFromHeight(height);
        scrollViewRef.current.scrollTo({ x: position, animated });

        // Re-enable height updates after scrolling completes
        setTimeout(() => {
            shouldUpdateHeight.current = true;
        }, animated ? 300 : 50);
    };

    // Initialize the slider position
    useEffect(() => {
        // Only run this once after first render
        if (!initialRenderComplete.current) {
            setTimeout(() => {
                scrollToHeight(heightRulerValue, false);
                initialRenderComplete.current = true;
            }, 300);
        }
    }, []);

    // Handle unit change
    useEffect(() => {
        if (initialRenderComplete.current) {
            // Re-center on height after unit change
            scrollToHeight(heightRulerValue);
        }
    }, [unit]);

    // Handle scrolling and update height
    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!shouldUpdateHeight.current) return;

        const offsetX = event.nativeEvent.contentOffset.x;
        const calculatedHeight = getHeightFromScrollPosition(offsetX);

        if (calculatedHeight >= MIN_HEIGHT_CM && calculatedHeight <= MAX_HEIGHT_CM) {
            setHeightRulerValue(calculatedHeight);
        }
    };

    // Handle scroll end to snap to nearest marker
    const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        // Get the exact height at current scroll position
        const offsetX = event.nativeEvent.contentOffset.x;
        const calculatedHeight = getHeightFromScrollPosition(offsetX);

        if (calculatedHeight >= MIN_HEIGHT_CM && calculatedHeight <= MAX_HEIGHT_CM) {
            // Update the height value
            setHeightRulerValue(calculatedHeight);

            // Scroll to exact position for this height
            scrollToHeight(calculatedHeight);
        }
    };

    // Change unit handler
    const handleUnitChange = (newUnit: 'cm' | 'ft') => {
        if (unit !== newUnit) {
            setUnit(newUnit);
        }
    };

    // Continue handler
    const handleContinue = async () => {
        try {
            // Store height in store - use the DISPLAY height (with offset)
            const saveHeight = getDisplayHeight(heightRulerValue);

            if (unit === 'cm') {
                updateHeightInStore(saveHeight, 'cm');
            } else {
                // For feet/inches, convert the display height
                const displayHeightFt = convertHeight(saveHeight, 'cm', 'ft');
                updateHeightInStore(displayHeightFt, 'ft');
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
        const paddingWidth = width / 2; // Add padding on each side for better scrolling

        // Left padding
        markers.push(
            <View key="left-padding" style={{ width: paddingWidth }} />
        );

        // Generate markers for each height value
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
                        }
                    ]}
                >
                    {isMainMarker && (
                        <Text style={styles.markerText}>
                            {markerHeight}
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
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Main Content */}
            <View style={styles.contentContainer}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <BackButton onPress={() => navigation.goBack()} />
                    <Text style={styles.headerText}>Assessment</Text>
                    <View style={styles.progressPill}>
                        <Text style={styles.progressText}>5 of 10</Text>
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
                        {unit === 'cm'
                            ? getDisplayHeight(heightRulerValue)
                            : Math.floor(displayedHeight / 100)
                        }
                    </Text>
                    {unit === 'ft' && (
                        <Text style={styles.inchesText}>{displayedHeight % 100}"</Text>
                    )}
                    {unit === 'cm' && (
                        <Text style={styles.unitText}>{unit}</Text>
                    )}
                </View>

                {/* Height Ruler */}
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

                {/* Flexible spacer to push content up */}
                <View style={styles.flexSpacer} />
            </View>

            {/* Footer with Continue Button - Fixed at bottom */}
            <View style={styles.footerContainer}>
                <ContinueButton onPress={handleContinue} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
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
        minHeight: 20, // Minimum height to ensure some space
    },
    footerContainer: {
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 30 : 20,
        backgroundColor: '#FFFFFF',
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

export default HeightSelection;