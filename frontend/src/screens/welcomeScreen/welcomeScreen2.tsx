import { colors, images } from '@/src/theme';
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Svg, Path } from 'react-native-svg';

export default function WelcomeScreen2() {
  return (
    <SafeAreaView style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepButtonContainer}>
        <TouchableOpacity style={styles.stepButton}>
          <Text style={styles.stepText}>Step One</Text>
        </TouchableOpacity>
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image 
          source={images.stepOne} 
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
          <Text style={styles.titleText}>Personalize Your Mental</Text>
          <Text style={[styles.titleText, styles.highlightedText]}>Health State</Text>
          <Text style={styles.titleText}>With AI</Text>
        </View>

        {/* Navigation Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.navButton}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path d="M8 5l8 7-8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6eadb',
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
    borderColor: colors.marron,
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  stepText: {
    color: colors.marron,
    fontSize: 18,
    fontWeight: 'bold',
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  illustration: {
    width: 250,
    height: 280,
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
    backgroundColor: "#6B4E32",
  },
  progressBarEmpty: {
    flex: 2,
    backgroundColor: "#E0D6C4",
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  titleText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.marron,
    textAlign: 'center',
    lineHeight: 44,
  },
  highlightedText: {
    color: colors.green,
  },
  buttonContainer: {
    marginTop: 40,
  },
  navButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.marron,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

