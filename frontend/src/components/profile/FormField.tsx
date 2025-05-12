import React, { ReactNode } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity
} from 'react-native';

interface FormFieldProps {
    label: string;
    icon?: ReactNode;
    rightIcon?: ReactNode;
    value: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    isDropdown?: boolean;
    onPress?: () => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
}

const FormField = ({
    label,
    icon,
    rightIcon,
    value,
    onChangeText,
    placeholder,
    isDropdown = false,
    onPress,
    secureTextEntry = false,
    keyboardType = 'default'
}: FormFieldProps) => {
    const Container = isDropdown ? TouchableOpacity : View;
    const containerProps = isDropdown ? { onPress } : {};

    return (
        <>
            <Text style={styles.label}>{label}</Text>
            <Container style={styles.inputContainer} {...containerProps}>
                {icon}
                {isDropdown ? (
                    <Text style={styles.dropdownText}>{value}</Text>
                ) : (
                    <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChangeText}
                        placeholder={placeholder}
                        secureTextEntry={secureTextEntry}
                        keyboardType={keyboardType}
                    />
                )}
                {rightIcon}
            </Container>
        </>
    );
};

const styles = StyleSheet.create({
    label: {
        fontSize: 14,
        color: '#6D4C41',
        marginBottom: 8,
        marginLeft: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    input: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
    dropdownText: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: '#333',
    },
});

export default FormField;