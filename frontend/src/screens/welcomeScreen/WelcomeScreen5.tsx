import NextButton from '@/src/components/NextButton';
import { images } from '@/src/theme';
import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// Define the navigation param list type
type RootStackParamList = {

  WelcomeScreen6: undefined; 
  // Add other screens as needed
};

type NavigationProp = StackNavigationProp<RootStackParamList>;
  const navigation = useNavigation<NavigationProp>();
const WelcomeScreen5 = () => {

  return (
    <ImageBackground 
      source={images.WelcomeScreen5} // Background image
      style={styles.background}
      resizeMode="cover"
    >
      {/* Step Four Indicator */}
      <View style={styles.stepButtonContainer}>
        <TouchableOpacity style={styles.stepButton}>
          <Text style={styles.stepText}>Step Four</Text>
        </TouchableOpacity>
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
          <Text style={styles.titleText}>Mindful Resources That</Text>
          <Text style={styles.titleText}>Make You Happy</Text>
        </View>

        {/* Navigation Button */}
        <View style={styles.buttonContainer}>
          <NextButton onPress={() => navigation.navigate('WelcomeScreen6')} />
        </View>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'flex-start', // Ensures content stays near the top
  },
  stepButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 50, // Adjust spacing to ensure visibility
  },
  stepButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#6B4E32',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  stepText: {
    color: '#6B4E32',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bottomContainer: {
    position: "absolute",
    top: "55%", // Adjusted to start earlier
    left: 0,
    right: 0,
    height: "45%", // Adjusted for better overlay
    backgroundColor: "white",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#6B4E32",
  },
  progressBarEmpty: {
    flex: 2,
    backgroundColor: "#E0D6C4",
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  titleText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#6B4E32',
    textAlign: 'center',
    lineHeight: 36,
  },
  buttonContainer: {
    marginTop: 30,
  },
  navButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6B4E32',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WelcomeScreen5;
