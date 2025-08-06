import { colors, images } from '@/src/theme';
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Svg, Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WelcomeStackParamList } from '@/src/navigation/WelcomeNavigation';
import { commonWelcomeStyles } from '@/src/theme/style';
import NextButton from '@/src/components/NextButton';

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
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFilled, { flex: 1 }]} />
          <View style={[styles.progressBarEmpty, { flex: 4 }]} />
        </View>

        {/* Title Text */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Personalize Your Mental</Text>
          <Text style={[styles.titleText, styles.highlightedText]}>Health State</Text>
          <Text style={styles.titleText}>With AI</Text>
        </View>

        {/* Navigation Button */}
        <View style={styles.buttonContainer}>
          <NextButton onPress={() => navigation.navigate('WelcomeScreen3')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonWelcomeStyles,
  container: {
    ...commonWelcomeStyles.container,
    backgroundColor: '#e6eadb', // Keep unique background color
  },
  titleText: {

    fontSize: 30,
    fontWeight: 'bold',
    color: colors.marron,
  },
  highlightedText: {
    fontWeight: 'bold',
    color: "#9BB168",
  },
});