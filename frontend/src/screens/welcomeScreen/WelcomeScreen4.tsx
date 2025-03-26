import NextButton from '@/src/components/NextButton';
import { colors, images } from '@/src/theme';
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define the navigation param list type
type RootStackParamList = {
  WelcomeScreen1: undefined;
  WelcomeScreen2: undefined;
  WelcomeScreen3: undefined;
  WelcomeScreen4: undefined;
  // Add other screens as needed
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const WelcomeScreen4 = () => {
  const navigation = useNavigation<NavigationProp>();
  
  return (
    <View style={styles.container}>
      {/* Step Three Indicator */}
      <View style={styles.stepButtonContainer}>
        <TouchableOpacity style={styles.stepButton}>
          <Text style={styles.stepText}>Step Three</Text>
        </TouchableOpacity>
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image 
          source={images.womenread} // Replace with your image path
          style={styles.illustration}
          resizeMode="cover" 
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarFilled} />
          <View style={styles.progressBarEmpty} />
        </View>

        {/* Title Text */}
        <View style={styles.titleContainer}>
        <Text style={styles.titleText}>AI
          <Text style={styles.highlighttext}> Mental </Text>
          <Text style={styles.titleText}>Journaling & AI Therapy Chatbot</Text>
          </Text>
        </View>

        {/* Navigation Button */}
        <View style={styles.buttonContainer}>
          <NextButton  onPress={() => navigation.navigate('WelcomeScreen2')} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Adjust background color as needed
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  stepButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  stepButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.marron, // Adjust border color as needed
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  stepText: {
    color: colors.marron, // Adjust text color as needed
    fontSize: 18,
    fontWeight: 'bold',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  illustration: {
    width: 410, // Adjust width as needed
    height: 300, // Adjust height as needed
  },
  bottomContainer: {
    flex: 2,
    backgroundColor: colors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 20,
    alignItems: "center",
    width: "100%",
  },
  progressBarContainer: {
    flexDirection: "row",
    width: "60%",
    height: 6,
    borderRadius: 3,
    marginBottom: 20,
    overflow: "hidden",
  },
  progressBarFilled: {
    flex: 3,
    backgroundColor: colors.marron, // Adjust progress bar filled color as needed
  },
  progressBarEmpty: {
    flex: 2,
    backgroundColor: "#E8DDD9", // Adjust progress bar empty color as needed
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  titleText: {
    fontSize: 30, // Adjust font size as needed
    fontWeight: 'bold',
    color: colors.marron, // Adjust text color as needed
    textAlign: 'center',
    lineHeight: 36, // Adjust line height as needed
  },
  highlighttext: {

    color: '#736B66', // You can use a different color for highlight
  },
  buttonContainer: {
    marginTop: 100,
  },
  navButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.marron, // Adjust button color as needed
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen4;