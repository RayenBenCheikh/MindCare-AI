import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator'; // Adjust the import path as necessary

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface WeightSelectionProps {
    onWeightSelected?: (weight: number, unit: 'kg' | 'lbs') => void;
    initialWeight?: number;
    initialUnit?: 'kg' | 'lbs';
}

const WeightSelection: React.FC<WeightSelectionProps> = ({
    onWeightSelected,
    initialWeight = 70,
    initialUnit = 'kg',
}) => {
    const [weight, setWeight] = useState<number>(initialWeight);
    const [unit, setUnit] = useState<'kg' | 'lbs'>(initialUnit);
    const navigation = useNavigation<NavigationProp>()

    const handleWeightChange = (value: string) => {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue > 0) {
            setWeight(numValue);
        }
    };

    const toggleUnit = () => {
        if (unit === 'kg') {
            setWeight(Math.round(weight * 2.20462 * 10) / 10);
            setUnit('lbs');
        } else {
            setWeight(Math.round(weight * 0.453592 * 10) / 10);
            setUnit('kg');
        }
    };

    const incrementWeight = () => {
        setWeight(prevWeight => parseFloat((prevWeight + (unit === 'kg' ? 0.5 : 1)).toFixed(1)));
    };

    const decrementWeight = () => {
        if (weight > (unit === 'kg' ? 0.5 : 1)) {
            setWeight(prevWeight => parseFloat((prevWeight - (unit === 'kg' ? 0.5 : 1)).toFixed(1)));
        }
    };

    const handleContinue = () => {
        if (onWeightSelected) {
            onWeightSelected(weight, unit);
        }
        // Navigate to the next screen
        navigation.navigate('AgeSelection'); // Replace with your next screen name
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>What is your weight?</Text>
                <Text style={styles.subtitle}>This helps us personalize your mental health assessment.</Text>

                <View style={styles.weightSelector}>
                    <TouchableOpacity style={styles.button} onPress={decrementWeight}>
                        <Text style={styles.buttonText}>-</Text>
                    </TouchableOpacity>

                    <View style={styles.weightInputContainer}>
                        <TextInput
                            style={styles.weightInput}
                            value={weight.toString()}
                            onChangeText={handleWeightChange}
                            keyboardType="numeric"
                        />
                        <TouchableOpacity onPress={toggleUnit}>
                            <Text style={styles.unitText}>{unit}</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.button} onPress={incrementWeight}>
                        <Text style={styles.buttonText}>+</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.hint}>
                    Tap on {unit} to switch to {unit === 'kg' ? 'lbs' : 'kg'}
                </Text>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
        color: '#333',
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 40,
        textAlign: 'center',
        color: '#666',
    },
    weightSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 30,
    },
    button: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#f0f0f0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    weightInputContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginHorizontal: 20,
    },
    weightInput: {
        fontSize: 40,
        fontWeight: 'bold',
        textAlign: 'center',
        width: 100,
        color: '#333',
    },
    unitText: {
        fontSize: 20,
        color: '#666',
        marginLeft: 5,
    },
    hint: {
        fontSize: 14,
        color: '#999',
        marginTop: 10,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#ECECEC',
    },
    backButton: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        backgroundColor: '#f0f0f0',
        marginRight: 10,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    continueButton: {
        flex: 1,
        padding: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        backgroundColor: '#4A90E2',
        marginLeft: 10,
    },
    continueButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
});

export default WeightSelection;