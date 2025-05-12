import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
    title: string;
    onBackPress?: () => void;
    rightElement?: React.ReactNode;
    showBackButton?: boolean;
    backgroundColor?: string;
    textColor?: string;
}

const Header: React.FC<HeaderProps> = ({
    title,
    onBackPress,
    rightElement,
    showBackButton = true,
    backgroundColor = '#B5C99A',
    textColor = 'white'
}) => {
    return (
        <View style={[styles.header, { backgroundColor }]}>
            {showBackButton ? (
                <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
                    <Ionicons name="chevron-back" size={24} color={textColor} />
                </TouchableOpacity>
            ) : (
                <View style={{ width: 36 }} /> // Empty placeholder for alignment
            )}

            <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>

            {rightElement || <View style={{ width: 36 }} />}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
});

export default Header;