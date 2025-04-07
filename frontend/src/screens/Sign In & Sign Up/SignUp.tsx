import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator'; // Adjust path as needed
import { colors } from '@/src/theme';

// Define navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SignUpScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigation = useNavigation<NavigationProp>();

  const validateEmail = (text: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmail(text);
    setIsEmailValid(text.length === 0 || emailRegex.test(text));
  };

  const handleSignUp = async () => {
    if (!isEmailValid || email.length === 0) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://10.6.68.72:5000/api/auth/register', {
        name: 'User', // You can add a name field to the form if needed
        email,
        password,
      });
      Alert.alert('Success', response.data.message, [
        { text: 'OK', onPress: () => navigation.navigate('SignIn') },
      ]);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || 'Something went wrong. Please try again.');
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header with wave and logo */}
      <View style={styles.headerContainer}>
        <View style={styles.waveBg} />
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={[styles.logoDot, { top: 0, left: 12 }]} />
            <View style={[styles.logoDot, { top: 12, left: 0 }]} />
            <View style={[styles.logoDot, { top: 12, left: 24 }]} />
            <View style={[styles.logoDot, { top: 24, left: 12 }]} />
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Sign Up To MINDCARE-AI</Text>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#FFF" style={styles.warningIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#6B4226" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email..."
              placeholderTextColor="#999"
              value={email}
              onChangeText={validateEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
          
          {!isEmailValid && email.length > 0 && (
            <View style={styles.errorContainer}>
              <Ionicons name="warning" size={20} color="#FFF" style={styles.warningIcon} />
              <Text style={styles.errorText}>Invalid Email Address!!!</Text>
            </View>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#6B4226" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password..."
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password Confirmation</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={24} color="#6B4226" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm your password..."
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
              <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={24} color="#999" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.signUpButton}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.signUpButtonText}>Sign Up</Text>
              <Ionicons name="arrow-forward" size={24} color="#FFF" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signInLink}>Sign In.</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Les styles restent les mêmes que dans votre code existant
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  headerContainer: {
    position: 'relative',
    height: 200,
  },
  waveBg: {
    backgroundColor: colors.green,
    height: 200,
    borderBottomLeftRadius: 300,
    borderBottomRightRadius: 300,
    width: '130%',
    marginLeft: '-15%',
    marginTop: -50,
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  logo: {
    width: 36,
    height: 36,
    position: 'relative',
  },
  logoDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.marron,
    marginBottom: 40,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.marron,
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: 30,
    backgroundColor: 'white',
    paddingHorizontal: 15,
    height: 60,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#736B66',
    height: '100%',
  },
  eyeIcon: {
    padding: 5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ED7E1C',
    borderRadius: 30,
    marginTop: 10,
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  warningIcon: {
    marginRight: 10,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpButton: {
    flexDirection: 'row',
    backgroundColor: colors.marron,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 10,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  signInText: {
    color: '#736B66',
    fontSize: 16,
  },
  signInLink: {
    color: colors.orange,
    fontSize: 16,
    fontWeight: 'bold',
  },

});

export default SignUpScreen;