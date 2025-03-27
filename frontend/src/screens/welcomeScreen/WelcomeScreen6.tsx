import { images } from '@/src/theme';
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const WelcomeScreen6 = () => {
  return (
    <View style={styles.container}>
      {/* Step Five Indicator */}
      
      <View style={styles.stepButtonContainer}>
        <TouchableOpacity style={styles.stepButton}>
          <Text style={styles.stepText}>Step Five</Text>
        </TouchableOpacity>
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image 
          source={images.WelcomeScreen6} // Replace with your image path
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
          <Text style={styles.titleText}>Loving & Supportive</Text>
          <Text style={styles.titleText}>Community</Text>
        </View>

        {/* Navigation Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.navButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M9 6 L15 12 L9 18" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5FF', // Light background color
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  stepButtonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 0,
  },
  stepButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#6B4E32', // Border color
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  stepText: {
    color: '#6B4E32', // Text color
    fontSize: 18,
    fontWeight: 'bold',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    width: '100%',// Make the image container take full width
    height:'80%'
  },
  illustration: {
    width: '100%', // Make the image take full width
    height:'100%', // Adjust height as needed
    resizeMode: 'cover',
  },
  bottomContainer: {
    flex: 2,
    backgroundColor: 'white',
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
    backgroundColor: "#6B4E32", // Progress bar filled color
  },
  progressBarEmpty: {
    flex: 2,
    backgroundColor: "#E0D6C4", // Progress bar empty color
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  titleText: {
    fontSize: 30, // Adjust font size as needed
    fontWeight: 'bold',
    color: '#6B4E32', // Text color
    textAlign: 'center',
    lineHeight: 36, // Adjust line height as needed
  },
  buttonContainer: {
    marginTop: 40,
  },
  navButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6B4E32', // Button color
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default WelcomeScreen6