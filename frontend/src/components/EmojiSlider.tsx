import React, { useEffect, useRef } from 'react';
import {
    Dimensions,
    FlatList,
    Text,
    View,
    StyleSheet,
} from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = 60;
const EMOJIS = ['😟', '😐', '😑', '🙂', '😊'];
const COLORS = ['#FF7A50', '#FFB240', '#F6D463', '#A4C472', '#8D7BEA', '#FF6F91'];
const SPACER_WIDTH = (width - ITEM_WIDTH) / 2;
const RADIUS = 100;

// Emoji Item Component
const EmojiItem = ({
    item,
    index,
    scrollX,
}: {
    item: string;
    index: number;
    scrollX: Animated.SharedValue<number>;
}) => {
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
        <Animated.View style={[styles.emojiContainer, animatedStyle, { backgroundColor: COLORS[index] }]}>
            <Text style={styles.emoji}>{item}</Text>
        </Animated.View>
    );
};

// Main Slider
const CurvedEmojiSlider = () => {
    const scrollX = useSharedValue(0);
    const flatListRef = useRef<FlatList>(null);

    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollX.value = event.contentOffset.x;
        },
    });

    // Scroll to center emoji on mount
    useEffect(() => {
        // Center emoji is at index 1 + 2 = 3 (accounting for 'left-spacer')
        const defaultIndex = 3 + Math.floor(EMOJIS.length / 2);
        const offset = defaultIndex * ITEM_WIDTH - SPACER_WIDTH;

        requestAnimationFrame(() => {
            flatListRef.current?.scrollToOffset({
                offset,
                animated: false,
            });
            scrollX.value = offset;
        });
    }, []);

    return (
        <View style={styles.container}>
            <Animated.FlatList
                ref={flatListRef}
                data={['left-spacer', ...EMOJIS, 'right-spacer']}
                horizontal
                bounces={false}
                showsHorizontalScrollIndicator={false}
                snapToInterval={ITEM_WIDTH}
                decelerationRate="fast"
                keyExtractor={(_, index) => index.toString()}
                onScroll={scrollHandler}
                scrollEventThrottle={16}
                contentContainerStyle={styles.flatListContent}
                renderItem={({ item, index }) => {
                    if (item === 'left-spacer' || item === 'right-spacer') {
                        return <View style={{ width: SPACER_WIDTH }} />;
                    }

                    return (
                        <EmojiItem
                            item={item}
                            index={index}
                            scrollX={scrollX}
                        />
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
    },
    flatListContent: {
        alignItems: 'center',
        paddingTop: 40,
    },
    emojiContainer: {
        width: ITEM_WIDTH,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: ITEM_WIDTH / 2,
    },
    emoji: {
        fontSize: 52,
    },
});

export default CurvedEmojiSlider;