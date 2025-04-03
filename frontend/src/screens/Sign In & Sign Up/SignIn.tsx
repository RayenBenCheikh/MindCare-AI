import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { colors } from '@/src/theme';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

// Define navigation prop type
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigation = useNavigation<NavigationProp>();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      // Store the JWT token in AsyncStorage
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      Alert.alert('Success', 'Logged in successfully!', [
        { text: 'OK', onPress: () => console.log('User logged in:', user) },
      ]);
      // Optionally navigate to a home screen after login
      // navigation.navigate('Home');
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.fullContainer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#9CB380', '#9CB380']}
        style={styles.headerContainer}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <View style={[styles.logoDot, { top: 0, left: 12 }]} />
            <View style={[styles.logoDot, { top: 12, left: 0 }]} />
            <View style={[styles.logoDot, { top: 12, left: 24 }]} />
            <View style={[styles.logoDot, { top: 24, left: 12 }]} />
          </View>
        </View>
      </LinearGradient>
      <View style={styles.titleContainer}>
        <Text style={styles.titlePart1}>Sign In To MINDCARE-AI</Text>
      </View>
      <View style={styles.content}>
        {error ? (
          <View style={styles.errorContainer}>
            <Icon name="alert" size={20} color="#FFF" style={styles.warningIcon} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputField, { borderColor: '#9CB380' }]}>
            <Icon name="email-outline" size={20} color="#8B5A2B" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="example@gmail.com"
              placeholderTextColor="#777"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputField, { borderColor: '#ddd' }]}>
            <Icon name="lock-outline" size={20} color="#8B5A2B" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="Enter your password..."
              placeholderTextColor="#777"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color="#8B5A2B"
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.signInButton} onPress={handleSignIn} disabled={loading}>
          <Text style={styles.signInText}>{loading ? 'Signing In...' : 'Sign In'}</Text>
          {!loading && <Icon name="arrow-right" size={20} color="#fff" style={{ marginLeft: 5 }} />}
        </TouchableOpacity>
        <View style={styles.socialButtons}>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="facebook" size={24} color="#8B5A2B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="google" size={24} color="#8B5A2B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="instagram" size={24} color="#8B5A2B" />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomText}>
          <Text style={styles.bottomTextNormal}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.bottomTextLink}>Sign Up</Text>
          </TouchableOpacity>
          <Text style={styles.bottomTextNormal}>.</Text>
        </View>
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: { 
    flex: 1, 
    backgroundColor: '#FFFFFF' 
  },
  headerContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
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
  titleContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  titlePart1: {
    fontSize: 30,
    color: '#5D4037',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    marginTop: 30,
    paddingHorizontal: 30,
  },
  inputContainer: { 
    width: '100%', 
    marginBottom: 20 
  },
  label: { 
    fontSize: 16, 
    color: '#5D4037', 
    marginBottom: 10, 
    fontWeight: 'bold' 
  },
  inputField: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderRadius: 30, 
    paddingHorizontal: 15, 
    height: 60,
    backgroundColor: '#FFFFFF'
  },
  icon: { marginRight: 10 },
  inputText: { flex: 1, color: '#333', fontSize: 16 },
  signInButton: { 
    flexDirection: 'row', 
    backgroundColor: '#5D4037', 
    borderRadius: 30, 
    paddingVertical: 15, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 10,
    marginBottom: 30 
  },
  signInText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  socialButtons: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 30 
  },
  socialButton: { 
    width: 60, 
    height: 60, 
    borderRadius: 30, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  bottomText: { 
    flexDirection: 'row', 
    justifyContent: 'center',
    marginBottom: 5
  },
  bottomTextNormal: { fontSize: 16, color: '#666' },
  bottomTextLink: { fontSize: 16, color: '#ED7E1C', fontWeight: 'bold' },
  forgotPassword: { 
    alignItems: 'center'
  },
  forgotPasswordText: { 
    fontSize: 16, 
    color: '#ED7E1C', 
    textAlign: 'center', 
    fontWeight: 'bold' 
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ED7E1C',
    borderRadius: 30,
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  warningIcon: { marginRight: 10 },
  errorText: { color: 'white', fontSize: 16, fontWeight: '600' },
});

export default SignIn;