import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { images } from '@/src/theme';

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.fullContainer}>
      <LinearGradient
        colors={['#A8B5A2', '#F5E8C7']}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <Image source={images.logo} style={styles.logo} resizeMode="contain" />
        </View>
        <Text style={styles.title}>Sign In To MINDCARE-AI</Text>
      </LinearGradient>
      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputField, { borderColor: '#A8B5A2' }]}>
            <Icon name="email-outline" size={20} color="#8B5A2B" style={styles.icon} />
            <TextInput
              style={styles.inputText}
              placeholder="exemple@gmail.com"
              placeholderTextColor="#777"
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
        <TouchableOpacity style={styles.signInButton}>
          <Text style={styles.signInText}>Sign In</Text>
          <Icon name="arrow-right" size={20} color="#fff" style={{ marginLeft: 5 }} />
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
          <Text style={styles.bottomTextLink}>Sign Up</Text>
        </View>
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  fullContainer: { flex: 1 },
  header: { height: 100, justifyContent: 'center', alignItems: 'center', paddingTop: 20 },
  content: { flex: 1, backgroundColor: '#fff', padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  logoContainer: { alignItems: 'center', marginBottom: 10 },
  logo: { width: 100, height: 100 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#8B5A2B', textAlign: 'center', marginBottom: 10 },
  inputContainer: { width: '100%', marginBottom: 20 },
  label: { fontSize: 16, color: '#8B5A2B', marginBottom: 5 },
  inputField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, height: 50 },
  icon: { marginRight: 10 },
  inputText: { flex: 1, color: '#333' },
  signInButton: { flexDirection: 'row', backgroundColor: '#8B5A2B', borderRadius: 25, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  signInText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  socialButtons: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  socialButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginHorizontal: 10 },
  bottomText: { flexDirection: 'row', justifyContent: 'center' },
  bottomTextNormal: { fontSize: 16, color: '#777' },
  bottomTextLink: { fontSize: 16, color: '#D4A017', fontWeight: 'bold' },
  forgotPassword: { marginTop: 10 },
  forgotPasswordText: { fontSize: 16, color: '#D4A017', textAlign: 'center' },
});

export default SignIn;