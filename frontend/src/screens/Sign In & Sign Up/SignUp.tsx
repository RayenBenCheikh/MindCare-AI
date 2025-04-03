import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator'; // Adjust path as needed

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
      const response = await axios.post('http://localhost:5000/api/auth/register', {
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
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#A8B5A2', '#F5E8C7']}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={[styles.logoDot, { top: 0, left: 12 }]} />
            <View style={[styles.logoDot, { top: 12, left: 0 }]} />
            <View style={[styles.logoDot, { top: 12, left: 24 }]} />
            <View style={[styles.logoDot, { top: 24, left: 12 }]} />
          </View>
        </View>
        <Text style={styles.title}>Sign Up For Free</Text>
      </LinearGradient>
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#FFF" style={styles.warningIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputContainer, !isEmailValid && styles.inputError]}>
            <Ionicons name="mail-outline" size={24} color="#6B4226" style={styles.inputIcon} />
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
          {!isEmailValid && (
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
        <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.signUpButtonText}>{loading ? 'Signing Up...' : 'Sign Up'}</Text>
          {!loading && <Ionicons name="arrow-forward" size={24} color="#FFF" />}
        </TouchableOpacity>
        <View style={styles.signInContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
            <Text style={styles.signInLink}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8E7' },
  header: { 
    height: 150, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30 
  },
  logoContainer: { 
    position: 'absolute', 
    top: 20, 
    left: '10%', 
    alignItems: 'center' 
  },
  logo: { width: 36, height: 36, position: 'relative' },
  logoDot: { 
    position: 'absolute', 
    width: 12, 
    height: 12, 
    borderRadius: 6, 
    backgroundColor: 'white' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#6B4226', 
    textAlign: 'center', 
    marginTop: 70 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 30, 
    paddingTop: 20, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20 
  },
  formGroup: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: 'bold', color: '#6B4226', marginBottom: 10 },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: '#E8E0D8', 
    borderRadius: 30, 
    backgroundColor: 'white', 
    paddingHorizontal: 15, 
    height: 60 
  },
  inputError: { borderColor: '#ED7E1C' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#6B4226', height: '100%' },
  eyeIcon: { padding: 5 },
  errorContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#ED7E1C', 
    borderRadius: 30, 
    marginTop: 10, 
    paddingVertical: 10, 
    paddingHorizontal: 15 
  },
  warningIcon: { marginRight: 10 },
  errorText: { color: 'white', fontSize: 16, fontWeight: '600' },
  signUpButton: { 
    flexDirection: 'row', 
    backgroundColor: '#6B4226', 
    borderRadius: 30, 
    paddingVertical: 18, 
    paddingHorizontal: 30, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginTop: 20 
  },
  signUpButtonText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginRight: 10 
  },
  signInContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 20 
  },
  signInText: { color: '#6A6A6A', fontSize: 16 },
  signInLink: { color: '#ED7E1C', fontSize: 16, fontWeight: 'bold' },
});

export default SignUpScreen;