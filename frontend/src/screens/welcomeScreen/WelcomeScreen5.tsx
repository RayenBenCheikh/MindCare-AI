import NextButton from '@/src/components/NextButton';
import { colors, images } from '@/src/theme';
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { WelcomeStackParamList } from '../../navigation/WelcomeNavigation';
import { commonWelcomeStyles } from '@/src/theme/style';

// Define the navigation param list type
type NavigationProp = StackNavigationProp<WelcomeStackParamList>;

const WelcomeScreen5 = () => {
  const navigation = useNavigation<NavigationProp>();
  return (
    <View style={styles.container}>

      {/* Step Four Indicator */}
      <View style={styles.stepButtonContainer}>
        <TouchableOpacity style={styles.stepButton}>
          <Text style={styles.stepText}>Step Four</Text>
        </TouchableOpacity>
      </View>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Image
          source={images.WelcomeScreen5}
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
          <Text style={styles.titleText}>Mindful
            <Text style={styles.highlightedText}> Resources </Text>
            <Text>That Makes You Happy</Text>
          </Text>
        </View>

        {/* Navigation Button */}
        <View style={styles.buttonContainer}>
          <NextButton onPress={() => navigation.navigate({
            name: 'WelcomeScreen6',
            params: {
              onComplete: () => {
                console.log('Welcome flow completed');
              }
            }
          })} />
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
  background: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  highlightedText: {
    color: "#FFBD1A",
  },
  titleText: {
    fontSize: 30,
    color: colors.marron,
    fontWeight: 'bold',
  },
}
);

export default WelcomeScreen5;