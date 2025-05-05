import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    TouchableOpacity,
    Dimensions,
    FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator';
import BackButton from '@/src/components/BackButton';
import { useAssessmentStore } from '@/src/store/Store';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    runOnJS,
} from 'react-native-reanimated';
import ContinueButton from '@/src/components/Continue';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 70;
const SPACER_WIDTH = (width - ITEM_WIDTH) / 2;
const RADIUS = 100;

interface Mood {
    id: string;
    label: string;
    emoji: string;
    color: string;
    textColor: string;
}

// Define moods with emojis to use with the curved slider
const moods: Mood[] = [
    {
        id: 'verySad',
        label: 'I Feel Terrible',
        emoji: '😢',
        color: '#E67E22',
        textColor: '#FFFFFF'
    },
    {
        id: 'sad',
        label: 'I Feel Down',
        emoji: '😟',
        color: '#F39C12',
        textColor: '#FFFFFF'
    },
    {
        id: 'neutral',
        label: 'I Feel Neutral',
        emoji: '😐',
        color: '#FFD54F',
        textColor: '#5D4037'
    },
    {
        id: 'good',
        label: 'I Feel Good',
        emoji: '🙂',
        color: '#9CCC65',
        textColor: '#FFFFFF'
    },
    {
        id: 'veryGood',
        label: 'I Feel Great',
        emoji: '😊',
        color: '#7986CB',
        textColor: '#FFFFFF'
    }
];

// Emoji Item Component
const EmojiItem = ({
    item,
    index,
    scrollX
}: {
    item: Mood | string;
    index: number;
    scrollX: Animated.SharedValue<number>;
}) => {
    // Skip for spacers
    if (item === 'left-spacer' || item === 'right-spacer') {
        return <View style={{ width: SPACER_WIDTH }} />;
    }

    const mood = item as Mood;

    const animatedStyle = useAnimatedStyle(() => {
        const position = (index - 1) * ITEM_WIDTH;
        const diff = scrollX.value - position;
        const angle = (diff / ITEM_WIDTH) * 0.4;

        const translateY = RADIUS * (1 - Math.cos(angle));
        const scale = interpolate(
            Math.abs(diff),
            [0, ITEM_WIDTH * 2],
            [1.4, 0.8],
            Extrapolate.CLAMP
        );
        const opacity = interpolate(
            Math.abs(diff),
            [0, ITEM_WIDTH * 2],
            [1, 0.4],
            Extrapolate.CLAMP
        );

        return {
            transform: [{ translateY }, { scale }],
            opacity,
        };
    });

    return (
        <Animated.View
            style={[
                styles.emojiContainer,
                animatedStyle,
                { backgroundColor: mood.color }
            ]}
        >
            <Text style={styles.emoji}>{mood.emoji}</Text>
        </Animated.View>
    );
};

const MoodSelection: React.FC = () => {
    const [selectedMood, setSelectedMood] = useState<Mood>(moods[2]); // Start with neutral
    const navigation = useNavigation<NavigationProp>();
    const scrollX = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);
    const setMood = useAssessmentStore(state => state.setMood);
    // Function to update the selected mood based on index
    const updateSelectedMood = (index: number) => {
        // Adjust index to account for the left spacer
        const moodIndex = index - 1;
        // Only update if it's a valid mood index
        if (moodIndex >= 0 && moodIndex < moods.length) {
            setSelectedMood(moods[moodIndex]);
        }
    };

    // Scroll handler with callback to update selected mood
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
            // Calculate which mood is currently centered
            const slideIndex = Math.round(event.contentOffset.x / ITEM_WIDTH);
            runOnJS(updateSelectedMood)(slideIndex);
        },
    });

    // Initialize to neutral mood (middle option)
    useEffect(() => {
        // Default to neutral mood (middle)
        const neutralIndex = Math.floor(moods.length / 2);
        const defaultIndex = neutralIndex + 1; // Add 1 for left spacer
        const offset = defaultIndex * ITEM_WIDTH;

        // Set timeout to ensure the component is fully mounted
        setTimeout(() => {
            if (flatListRef.current) {
                flatListRef.current.scrollToOffset({
                    offset,
                    animated: false,
                });
                scrollX.value = offset;
                setSelectedMood(moods[neutralIndex]);
            }
        }, 100);
    }, []);

    const handleContinue = async () => {
        try {
            // Save mood to Zustand store - FIXED: Pass the selectedMood data, not the setter function
            setMood(selectedMood.id, selectedMood.label);
            navigation.navigate('SleepSelection');
        } catch (error) {
            console.error('Error saving mood:', error);
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
                    <Text style={styles.progressText}>6 of 10</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>
                How would you describe your mood?
            </Text>

            {/* Selected Mood Display */}
            <View style={styles.moodDisplayContainer}>
                <Text style={styles.moodLabel}>{selectedMood.label}</Text>
                <View style={[styles.moodEmojiContainer, { backgroundColor: selectedMood.color }]}>
                    <Text style={styles.moodEmojiText}>{selectedMood.emoji}</Text>
                </View>
            </View>

            {/* Emoji Slider */}
            <View style={styles.sliderContainer}>
                <Animated.FlatList
                    ref={flatListRef}
                    data={['left-spacer', ...moods, 'right-spacer']}
                    horizontal
                    bounces={false}
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={ITEM_WIDTH}
                    decelerationRate="fast"
                    keyExtractor={(_, index) => index.toString()}
                    onScroll={scrollHandler}
                    scrollEventThrottle={16}
                    contentContainerStyle={styles.flatListContent}
                    renderItem={({ item, index }) => (
                        <EmojiItem
                            item={item}
                            index={index}
                            scrollX={scrollX}
                        />
                    )}
                    onMomentumScrollEnd={(event) => {
                        // Ensure selection is updated when scrolling stops
                        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
                        updateSelectedMood(slideIndex);
                    }}
                />
                <ContinueButton onPress={handleContinue} />
            </View>
            {/* Continue Button */}

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
        marginBottom: 30,
        color: '#5D4037',
        lineHeight: 40,
    },
    moodDisplayContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    moodLabel: {
        fontSize: 24,
        fontWeight: '500',
        color: '#5D4037',
        marginBottom: 15,
    },
    moodEmojiContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 8,
    },
    moodEmojiText: {
        fontSize: 70,
    },
    sliderContainer: {
        flex: 1,
        justifyContent: 'center',
        marginBottom: 20,
    },
    flatListContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emojiContainer: {
        width: ITEM_WIDTH,
        height: ITEM_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: ITEM_WIDTH / 2,
        marginHorizontal: 5,
    },
    emoji: {
        fontSize: 32,
    },
    continueButton: {
        padding: 18,
        borderRadius: 25,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
});

export default MoodSelection;