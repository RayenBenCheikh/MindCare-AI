import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { useNavigation, NavigationProp, NavigationState } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface BackButtonProps {
    color?: string;
    onPress?: () => void;
}

const BackButton = ({ color = "#5D4037", onPress }: BackButtonProps) => {
    // Fix: Add a try/catch to handle cases when navigation isn't available
    let navigation: Omit<NavigationProp<ReactNavigation.RootParamList>, "getState"> & { getState(): NavigationState | undefined; };
    try {
        navigation = useNavigation();
    } catch (error) {
        // Navigation context not available
    }

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else if (navigation) {
            navigation.goBack();
        } else {
            console.warn('Navigation not available and no onPress provided');
        }
    };

    return (
        <TouchableOpacity
            style={styles.backButton}
            onPress={handlePress}
            accessibilityLabel="Go back"
        >
            <View style={[styles.backButtonCircle, { borderColor: color }]}>
                <Ionicons name="chevron-back" size={24} color={color} />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    backButton: {
        marginBottom: 0,
    },
    backButtonCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#5D4037',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default BackButton;