import { colors, images } from '@/src/theme';
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WelcomeStackParamList } from '@/src/navigation/WelcomeNavigation';
type NavigationProp = NativeStackNavigationProp<WelcomeStackParamList>;

export default function WelcomeScreen2() {
  const navigation = useNavigation<NavigationProp>();
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
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('WelcomeScreen3')}>
            <Svg width="81" height="80" viewBox="0 0 81 80" fill="none">
              <Path d="M0.5 40C0.5 17.91 17.91 0.5 40 0.5C62.09 0.5 80 17.91 80 40C80 62.09 62.09 80 40 80C17.91 80 0.5 62.09 0.5 40Z" fill="#4F3422" />
              <Path d="M48.4335 33.9124C47.0934 32.166 45.2145 30.9105 43.0882 30.3408L42.5706 32.2726C44.2716 32.7284 45.7748 33.7328 46.8468 35.1299C47.7145 36.2607 48.2606 37.5977 48.4373 39L30.5 39V41L48.4373 41C48.2606 42.4024 47.7145 43.7393 46.8468 44.8701C45.7748 46.2673 44.2716 47.2716 42.5706 47.7274L43.0882 49.6593C45.2145 49.0895 47.0934 47.8341 48.4335 46.0876C49.7736 44.3412 50.5 42.2014 50.5 40C50.5 37.7987 49.7736 35.6588 48.4335 33.9124Z" fill="white" />
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
  nextButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
});

