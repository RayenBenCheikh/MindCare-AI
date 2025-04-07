import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '@/src/theme';
import { Colors } from 'react-native/Libraries/NewAppScreen';

type NavigationProp = NativeStackNavigationProp<any>;

// Custom Icon Components
const TwoFAIcon = () => (
  <View style={styles.twoFAIconContainer}>
    <View style={styles.lockBody}>
      <View style={styles.lockHole} />
    </View>
    <View style={styles.lockShackle} />
  </View>
);

const PasswordIcon = () => (
  <View style={styles.passwordIconContainer}>
    <View style={[styles.passwordQuadrant, { top: 0, left: 0, backgroundColor: '#A0B55C' }]} />
    <View style={[styles.passwordQuadrant, { top: 0, right: 0, backgroundColor: '#E8F0CF' }]} />
    <View style={[styles.passwordQuadrant, { bottom: 0, left: 0, backgroundColor: '#5D4037' }]} />
    <View style={[styles.passwordQuadrant, { bottom: 0, right: 0, backgroundColor: '#F7F7F2' }]} />
  </View>
);

const GoogleAuthIcon = () => (
  <View style={styles.googleAuthIconContainer}>
    <View style={[styles.googleAuthTriangle, { top: 0, left: 0, borderBottomColor: '#A0B55C' }]} />
    <View style={[styles.googleAuthTriangle, { top: 0, right: 0, borderBottomColor: '#E8F0CF', transform: [{ rotate: '90deg' }] }]} />
    <View style={[styles.googleAuthTriangle, { bottom: 0, right: 0, borderBottomColor: '#5D4037', transform: [{ rotate: '180deg' }] }]} />
    <View style={[styles.googleAuthTriangle, { bottom: 0, left: 0, borderBottomColor: '#F7F7F2', transform: [{ rotate: '270deg' }] }]} />
  </View>
);

const ForgotPassword = () => {
  const [selectedOption, setSelectedOption] = useState('password');
  const navigation = useNavigation<NavigationProp>();

  const handleSendPassword = () => {
    // Logic for sending password reset
    console.log('Send password reset via:', selectedOption);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F4F2" />
      
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <View style={styles.backButtonCircle}>
          <Icon name="chevron-left" size={24} color="#5D4037" />
        </View>
      </TouchableOpacity>

      {/* Header */}
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>
        Select contact details where you want to reset your password.
      </Text>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {/* 2FA Option */}
        <TouchableOpacity 
          style={[
            styles.optionButton, 
            selectedOption === '2fa' && styles.optionButtonSelected
          ]}
          onPress={() => setSelectedOption('2fa')}
        >
          <View style={styles.optionIconWrapper}>
            <TwoFAIcon />
          </View>
          <Text style={styles.optionText}>Use 2FA</Text>
        </TouchableOpacity>

        {/* Password Option */}
        <TouchableOpacity 
          style={[
            styles.optionButton, 
            selectedOption === 'password' && styles.optionButtonSelected
          ]}
          onPress={() => setSelectedOption('password')}
        >
          <View style={styles.optionIconWrapper}>
            <PasswordIcon />
          </View>
          <Text style={styles.optionText}>Password</Text>
        </TouchableOpacity>

        {/* Google Authenticator Option */}
        <TouchableOpacity 
          style={[
            styles.optionButton, 
            selectedOption === 'google' && styles.optionButtonSelected
          ]}
          onPress={() => setSelectedOption('google')}
        >
          <View style={styles.optionIconWrapper}>
            <GoogleAuthIcon />
          </View>
          <Text style={styles.optionText}>Google Authenticator</Text>
        </TouchableOpacity>
      </View>

      {/* Send Password Button */}
      <TouchableOpacity 
        style={styles.sendButton}
        onPress={handleSendPassword}
      >
        <Text style={styles.sendButtonText}>Send Password</Text>
        <Icon name="lock" size={20} color="#FFF" style={{ marginLeft: 8 }} />
      </TouchableOpacity>

      {/* Bottom Home Indicator */}
      <View style={styles.homeIndicator} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F4F2',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 24,
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
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.marron,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#736B66',
    marginBottom: 40,
    lineHeight: 26,
  },
  optionsContainer: {
    marginBottom: 40,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    padding: 12,
    marginBottom: 20,
    height: 70,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  optionButtonSelected: {
    borderColor: '#A0B55C',
    borderWidth: 1,
  },
  optionIconWrapper: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderRadius: 23,
    overflow: 'hidden',
    backgroundColor: colors.marron,
  },
  optionText: {
    fontSize: 20,
    color: Colors.marron,
    fontWeight: '500',
  },
  
  // 2FA Icon styles
  twoFAIconContainer: {
    width: 46,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5EAD7',
    borderRadius: 23,
  },
  lockBody: {
    width: 24,
    height: 18,
    backgroundColor: '#5D4037',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 10,
  },
  lockHole: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E6EFB3',
  },
  lockShackle: {
    width: 14,
    height: 14,
    borderWidth: 3,
    borderColor: '#5D4037',
    borderBottomWidth: 0,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    position: 'absolute',
    bottom: 22,
  },
  
  // Password Icon styles
  passwordIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    position: 'relative',
  },
  passwordQuadrant: {
    width: 23,
    height: 23,
    position: 'absolute',
  },
  
  // Google Auth Icon styles
  googleAuthIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: 'hidden',
    position: 'relative',
  },
  googleAuthTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 23,
    borderRightWidth: 23,
    borderBottomWidth: 23,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    position: 'absolute',
  },
  
  sendButton: {
    backgroundColor: '#5D4037',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 'auto',
    marginBottom: 40,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  homeIndicator: {
    width: 135,
    height: 5,
    backgroundColor: '#5D4037',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 8,
  },
});

export default ForgotPassword;