import BackButton from '@/src/components/BackButton';
import { colors, images } from '@/src/theme';
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/src/navigation/MentalNavigator'; // Adjust the import path as necessary


type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
// Gender symbol icons
const maleSymbolIcon = `
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M12.5 7.5L17.5 2.5M13.75 2.5H17.5V6.25M8.75 3.75C5.85 3.75 3.5 6.1 3.5 9C3.5 11.9 5.85 14.25 8.75 14.25C11.65 14.25 14 11.9 14 9C14 6.1 11.65 3.75 8.75 3.75Z" stroke=colors.marron stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const femaleSymbolIcon = `
<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M10 13.75V17.5M7.5 16.25H12.5M10 3.75C7.24 3.75 5 6 5 8.75C5 11.5 7.24 13.75 10 13.75C12.76 13.75 15 11.5 15 8.75C15 6 12.76 3.75 10 3.75Z" stroke=colors.marron stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const GenderSelection = () => {
  const [selectedGender, setSelectedGender] = useState<'male' | 'female' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const handleGenderSelection = (gender: 'male' | 'female') => {
    setSelectedGender(gender);
  };
  const handleContinue = async () => {
    if (!selectedGender) return;

    setIsLoading(true);
    try {
      // First, store locally in case user isn't authenticated yet
      await AsyncStorage.setItem('userGender', selectedGender);

      // Try to get auth token - if available, update on server
      const token = await AsyncStorage.getItem('userToken');

      if (token) {
        // User is authenticated, update on server
        await axios.post(
          'http://localhost:5000/api/auth/update-gender',
          { gender: selectedGender },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      }

      // Navigate to next screen - replace with your next screen
      navigation.navigate('AgeSelection');

    } catch (error) {
      console.error('Error saving gender:', error);
      Alert.alert(
        'Error Saving Selection',
        'There was a problem saving your selection. You can continue and we\'ll save it later.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Store "prefer_not_to_say" and navigate
    AsyncStorage.setItem('userGender', 'prefer_not_to_say');
    navigation.navigate("AgeSelection");
  };
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <BackButton />
        <Text style={styles.headerText}>Assessment</Text>
        <View style={styles.progressPill}>
          <Text style={styles.progressText}>2 of 10</Text>
        </View>
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
          <View style={styles.genderContent}>
            <Text style={styles.genderText}>I am Male</Text>
            <Image
              source={images.maleScreen}
              style={styles.characterImage}
            />
            <View style={styles.symbolContainer}>
              <SvgXml xml={maleSymbolIcon} width={20} height={20} />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.genderOption,
            selectedGender === 'female' && styles.selectedOption
          ]}
          onPress={() => handleGenderSelection('female')}
        >
          <View style={styles.genderContent}>
            <Text style={styles.genderText}>I am Female</Text>
            <Image
              source={images.FemaleScreen}
              style={styles.characterImage}
            />
            <View style={styles.symbolContainer}>
              <SvgXml xml={femaleSymbolIcon} width={20} height={20} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
        >
          <Text style={styles.skipText}>Prefer to skip, thanks</Text>
          <Text style={styles.skipXIcon}>×</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedGender || isLoading) && styles.disabledButton
          ]}
          disabled={!selectedGender || isLoading}
          onPress={handleContinue}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.continueText}>Continue</Text>
              <Text style={styles.continueArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },


  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.marron,
  },
  progressPill: {
    backgroundColor: '#E8DDD9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  progressText: {
    fontSize: 14,
    color: '#926247',
  },
  titleText: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    color: colors.marron,
    lineHeight: 40,
  },
  genderContainer: {
    marginTop: 0,
    marginBottom: 'auto', // Push the content to the top
    flexGrow: 0.7, // Allow it to grow but not take all space
  },
  genderOption: {
    width: '100%',
    height: 110, // Fixed height for consistency
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 20, // Add space between options
  },
  selectedOption: {
    borderColor: colors.marron,
    borderWidth: 2,
  },
  genderContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
  },
  genderText: {
    fontSize: 22,
    fontWeight: '500',
    color: colors.marron,
  },
  characterImage: {
    position: 'absolute',
    right: 15,
    height: 100,
    width: 140,
    resizeMode: 'contain',
  },
  symbolContainer: {
    position: 'absolute',
    bottom: 16,
    left: 25,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  skipButton: {
    alignSelf: 'center',
    backgroundColor: '#E5EAD7',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 25,
    marginBottom: 20,
  },
  skipText: {
    color: '#8DAA6D',
    fontSize: 16,
    marginRight: 5,
  },
  skipXIcon: {
    color: '#8DAA6D',
    fontSize: 18,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: colors.marron,
    padding: 18,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  continueArrow: {
    color: 'white',
    fontSize: 18,
    marginLeft: 8,
  },
});
export default GenderSelection;