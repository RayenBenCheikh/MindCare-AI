import NextButton from '@/src/components/NextButton';
import { colors, images } from '@/src/theme';
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WelcomeStackParamList } from '../../navigation/WelcomeNavigation';
import { commonWelcomeStyles } from '@/src/theme/style';

type NavigationProp = StackNavigationProp<WelcomeStackParamList>;

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
          source={images.womenread}
          style={styles.illustration}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFilled, { flex: 3 }]} />
          <View style={[styles.progressBarEmpty, { flex: 2 }]} />
        </View>

        {/* Title Text */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>AI
            <Text style={styles.highlightText}> Mental </Text>
            <Text style={styles.titleText}>Journaling & AI Therapy Chatbot</Text>
          </Text>
        </View>

        {/* Navigation Button */}
        <View style={styles.buttonContainer}>
          <NextButton onPress={() => navigation.navigate('WelcomeScreen5')} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ...commonWelcomeStyles,
  container: {
    ...commonWelcomeStyles.container,
    backgroundColor: '#F5F5F5', // Keep unique background color
  },
  highlightText: {
    color: '#736B66',
  },
  titleText: {
    fontSize: 30,
    color: colors.marron,
    fontWeight: 'bold',
  },
  highlightedText: {
    fontWeight: 'bold',
    color: "#736B66",
  }
});
export default WelcomeScreen4;