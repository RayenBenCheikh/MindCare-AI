import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { colors, fonts, images } from '@/src/theme';

const SignIn = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.fullContainer}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#A8B5A2', '#F5E8C7']}
        style={styles.header}
      >
        <View style={styles.logoContainer}>
          <Image source={images.logo} style={styles.logo} resizeMode="contain" />
        </View>
        </LinearGradient>
        <View style={styles.titleContainer}>
          <Text style={styles.titlePart1}>Sign In To MINDCARE-AI </Text>
          
        </View>
      
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
          <TouchableOpacity onPress={() => console.log('Sign Up Pressed')}>
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
  fullContainer: { flex: 1,
    backgroundColor:colors.white,
   },
  header: { 
    height: 150, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderBottomLeftRadius: 100, 
    borderBottomRightRadius: 100 
  },
  logoContainer: { 
    position: 'static', 
    top: 20, 
    left: '10%', 
    alignItems: 'center' 
  },
  logo: { width: 100, height: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  titleContainer: { 
    backgroundColor:colors.white,
    alignItems: 'center' ,
    marginTop:20,
  },
  titlePart1: { 
    fontSize: 30, 
    color: colors.marron, 
    fontWeight: fonts.extraBold, 
  },
  content: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20, 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20 
  },
  inputContainer: { width: '100%', marginBottom: 20 },
  label: { fontSize: 16, color: '#8B5A2B', marginBottom: 5 },
  inputField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 25, paddingHorizontal: 15, height: 50 },
  icon: { marginRight: 10 },
  inputText: { flex: 1, color: '#333' },
  signInButton: { flexDirection: 'row', backgroundColor: colors.marron, borderRadius: 25, paddingVertical: 15, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
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