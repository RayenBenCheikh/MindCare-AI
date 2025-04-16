import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { SvgXml } from 'react-native-svg';

// SVG Icons for Male and Female
const MaleIcon = () => (
  <SvgXml 
    xml={`
      <svg width="100" height="100" viewBox="0 0 100 100">
        <g fill="none" fill-rule="evenodd">
          <circle cx="50" cy="50" r="49" fill="#C1E1C1" />
          <path fill="#333" d="M50 25c-13.807 0-25 11.193-25 25s11.193 25 25 25 25-11.193 25-25S63.807 25 50 25zm0 40c-8.284 0-15-6.716-15-15s6.716-15 15-15 15 6.716 15 15-6.716 15-15 15z"/>
        </g>
      </svg>
    `}
    width={120}
    height={120}
  />
);

const FemaleIcon = () => (
  <SvgXml 
    xml={`
      <svg width="100" height="100" viewBox="0 0 100 100">
        <g fill="none" fill-rule="evenodd">
          <circle cx="50" cy="50" r="49" fill="#FFD1DC" />
          <path fill="#333" d="M50 25c-13.807 0-25 11.193-25 25s11.193 25 25 25 25-11.193 25-25S63.807 25 50 25zm0 40c-8.284 0-15-6.716-15-15s6.716-15 15-15 15 6.716 15 15-6.716 15-15 15z"/>
        </g>
      </svg>
    `}
    width={120}
    height={120}
  />
);

const GenderSelectionScreen = () => {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);

  const handleGenderSelection = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Assessment</Text>
        <Text style={styles.progressText}>2 of 14</Text>
      </View>

      {/* Title */}
      <Text style={styles.titleText}>What's your official gender?</Text>

      {/* Gender Selection */}
      <View style={styles.genderContainer}>
        <TouchableOpacity 
          style={[
            styles.genderOption, 
            selectedGender === 'male' && styles.selectedOption
          ]}
          onPress={() => handleGenderSelection('male')}
        >
          <MaleIcon />
          <Text style={styles.genderText}>I am Male</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.genderOption, 
            selectedGender === 'female' && styles.selectedOption
          ]}
          onPress={() => handleGenderSelection('female')}
        >
          <FemaleIcon />
          <Text style={styles.genderText}>I am Female</Text>
        </TouchableOpacity>
      </View>

      {/* Skip Option */}
      <TouchableOpacity style={styles.skipButton}>
        <Text style={styles.skipText}>Prefer to skip, thanks ×</Text>
      </TouchableOpacity>

      {/* Continue Button */}
      <TouchableOpacity 
        style={[
          styles.continueButton, 
          (!selectedGender) && styles.disabledButton
        ]}
        disabled={!selectedGender}
      >
        <Text style={styles.continueText}>Continue →</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  backIcon: {
    fontSize: 24,
    color: '#4A4A4A',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4A4A4A',
  },
  progressText: {
    fontSize: 14,
    color: '#9E9E9E',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    color: '#333333',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  genderOption: {
    width: '45%',
    alignItems: 'center',
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  selectedOption: {
    borderColor: '#4CAF50',
  },
  genderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A4A4A',
  },
  skipButton: {
    alignSelf: 'center',
    marginTop: 30,
  },
  skipText: {
    color: '#9E9E9E',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#4A4A4A',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.5,
  },
  continueText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GenderSelectionScreen;