import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    View,
    GestureResponderEvent
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

type ContinueButtonProps = {
    onPress: (event: GestureResponderEvent) => void;
    disabled?: boolean;
    style?: object;
};

const ContinueButton: React.FC<ContinueButtonProps> = ({
    onPress,
    disabled = false,
    style
}) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                disabled && styles.buttonDisabled,
                style
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.8}
        >
            <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>Continue</Text>
                {/* Fixed SVG syntax for React Native */}
                <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <Path d="M2 12L21 12" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                    <Path d="M16.5529 17.7956C17.8287 17.4537 18.9561 16.7004 19.7601 15.6526C20.5642 14.6047 21 13.3208 21 12C21 10.6792 20.5642 9.3953 19.7601 8.34743C18.9561 7.29957 17.8287 6.54629 16.5529 6.20445"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinejoin="round" />
                </Svg>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.marron, // Brown color
        borderRadius: 30,
        paddingVertical: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 15,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonDisabled: {
        backgroundColor: '#A1887F', // Lighter brown when disabled
        opacity: 0.7,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginEnd: 1
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginRight: 10,
    }
});

export default ContinueButton;