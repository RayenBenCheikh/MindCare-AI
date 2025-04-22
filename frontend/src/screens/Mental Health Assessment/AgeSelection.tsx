import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    StatusBar,
    FlatList,
    Dimensions,
    ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BackButton from '@/src/components/BackButton';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator'; // Adjust the import path as necessary

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { height } = Dimensions.get('window');

// Generate ages from 13 to 99
const ages = Array.from({ length: 87 }, (_, i) => i + 13);

// Item height for scroll calculations
const ITEM_HEIGHT = 80;
// Number of items to display at once (center item + items above and below)
const VISIBLE_ITEMS = 5;

const AgeSelection = () => {
    const [selectedAge, setSelectedAge] = useState<number>(18); // Default age 18
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation<NavigationProp>();
    const flatListRef = useRef<FlatList>(null);

    // Find the index of the initially selected age (18)
    const initialIndex = ages.findIndex(age => age === selectedAge);

    // Scroll to the initial selected age on first render
    useEffect(() => {
        if (flatListRef.current) {
            // Add a slight delay to ensure rendering is complete
            setTimeout(() => {
                flatListRef.current?.scrollToIndex({
                    index: initialIndex,
                    animated: false,
                    viewPosition: 0.5
                });
            }, 100);
        }
    }, []);

    const handleAgeSelect = (age: number) => {
        setSelectedAge(age);

        // Scroll to the selected age
        flatListRef.current?.scrollToIndex({
            index: ages.findIndex(a => a === age),
            animated: true,
            viewPosition: 0.5
        });
    };

    const handleContinue = async () => {
        setIsLoading(true);

        try {
            // Store age locally
            await AsyncStorage.setItem('userAge', selectedAge.toString());

            // Try to update on server if user is logged in
            const token = await AsyncStorage.getItem('userToken');

            if (token) {
                // You can implement the API call to update age on server here
                // Similar to what we did for gender selection
            }

            // Navigate to the next screen
            navigation.navigate('WeightSelection');
        } catch (error) {
            console.error('Error saving age:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle scroll events to snap to items
    const handleScroll = (event: { nativeEvent: { contentOffset: { y: any; }; }; }) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);

        if (index >= 0 && index < ages.length && ages[index] !== selectedAge) {
            setSelectedAge(ages[index]);
        }
    };

    // Handle errors when scrolling to index fails
    const handleScrollToIndexFailed = () => {
        const wait = new Promise(resolve => setTimeout(resolve, 500));
        wait.then(() => {
            flatListRef.current?.scrollToIndex({
                index: initialIndex > 0 ? initialIndex : 0,
                animated: false
            });
        });
    };

    // Render each age item
    const renderAgeItem = ({ item: age }: { item: number }) => {
        const isSelected = age === selectedAge;
        return (
            <TouchableOpacity
                style={[
                    styles.ageItem,
                    isSelected && styles.selectedAgeItem
                ]}
                onPress={() => handleAgeSelect(age)}
                activeOpacity={0.8}
            >
                <Text style={[
                    styles.ageText,
                    isSelected ? styles.selectedAgeText : styles.unselectedAgeText
                ]}>
                    {age}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header */}
            <View style={styles.headerContainer}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerText}>Assessment</Text>
                <View style={styles.progressPill}>
                    <Text style={styles.progressText}>3 of 14</Text>
                </View>
            </View>

            {/* Title */}
            <Text style={styles.titleText}>What's your age?</Text>

            {/* Age Picker */}
            <View style={styles.pickerContainer}>
                <FlatList
                    ref={flatListRef}
                    data={ages}
                    renderItem={renderAgeItem}
                    keyExtractor={(item) => item.toString()}
                    showsVerticalScrollIndicator={false}
                    snapToInterval={ITEM_HEIGHT}
                    decelerationRate="fast"
                    onScroll={handleScroll}
                    onScrollToIndexFailed={handleScrollToIndexFailed}
                    getItemLayout={(data, index) => ({
                        length: ITEM_HEIGHT,
                        offset: ITEM_HEIGHT * index,
                        index,
                    })}
                    contentContainerStyle={{
                        paddingVertical: (height * 0.40 - ITEM_HEIGHT) / 2,
                    }}
                />
            </View>

            {/* Continue Button */}
            <TouchableOpacity
                style={styles.continueButton}
                onPress={handleContinue}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                    <>
                        <Text style={styles.continueText}>Continue</Text>
                        <Text style={styles.continueArrow}>→</Text>
                    </>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingBottom: 20,
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
    pickerContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    ageItem: {
        height: ITEM_HEIGHT,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectedAgeItem: {
        backgroundColor: '#8DAA6D',
        borderRadius: 40,
        marginHorizontal: 20,
    },
    ageText: {
        fontSize: 70,
        fontWeight: 'bold',
    },
    selectedAgeText: {
        color: '#FFFFFF',
    },
    unselectedAgeText: {
        color: '#D3D3D3',
    },
    continueButton: {
        backgroundColor: '#5D4037',
        padding: 18,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    continueText: {
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

export default AgeSelection;