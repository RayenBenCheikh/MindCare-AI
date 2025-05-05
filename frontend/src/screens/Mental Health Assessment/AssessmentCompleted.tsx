import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AssessmentCompleted = () => {
    const navigation = useNavigation();





    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../../assets/completion.png')}
                    style={styles.image}
                    resizeMode="contain"
                />

                <Text style={styles.title}>Assessment Completed!</Text>

                <Text style={styles.message}>
                    Thank you for completing your mental health assessment. Your responses have been recorded
                    and analyzed to provide personalized insights.
                </Text>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.primaryButton} >
                        <Text style={styles.primaryButtonText}>View Results</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} >
                        <Text style={styles.secondaryButtonText}>Return to Home</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F8FF',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    image: {
        width: 200,
        height: 200,
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32',
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#424242',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 16,
    },
    primaryButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4CAF50',
    },
    secondaryButtonText: {
        color: '#4CAF50',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AssessmentCompleted;