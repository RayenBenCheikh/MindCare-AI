import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { colors } from '@/src/theme';
import axios, { AxiosError } from 'axios';
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
        colors={['#A8B5A2', '#F5E8C7']}
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
          <View style={[styles.inputField, { borderColor: '#A8B5A2' }]}>
            <Icon name="email-outline" size={20} color="#8B5A2B" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="exemple@gmail.com"
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
            <FontAwesome name="facebook" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="google" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialButton}>
            <FontAwesome name="instagram" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.bottomText}>
          <Text style={styles.bottomTextNormal}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.bottomTextLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: { flex: 1, backgroundColor: colors.white },
  headerContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    position: 'absolute',
    top: 20,
    left: '10%',
    alignItems: 'center',
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
    backgroundColor: colors.white,
    alignItems: 'center',
    marginTop: 20,
  },
  titlePart1: {
    fontSize: 30,
    color: colors.marron,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  inputContainer: { width: '100%', marginBottom: 20 },
  label: { fontSize: 14, color: colors.marron, marginBottom: 5, fontWeight: 'bold' },
  inputField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, height: 50 },
  icon: { marginRight: 10 },
  inputText: { flex: 1, color: '#333' },
  signInButton: { flexDirection: 'row', backgroundColor: colors.marron, borderRadius: 25, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  signInText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  socialButtons: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  socialButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.marron, justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  bottomText: { flexDirection: 'row', justifyContent: 'center' },
  bottomTextNormal: { fontSize: 16, color: '#777' },
  bottomTextLink: { fontSize: 16, color: colors.orange, fontWeight: 'bold' },
  forgotPassword: { marginTop: 10 },
  forgotPasswordText: { fontSize: 16, color: colors.orange, textAlign: 'center', fontWeight: 'bold' },
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