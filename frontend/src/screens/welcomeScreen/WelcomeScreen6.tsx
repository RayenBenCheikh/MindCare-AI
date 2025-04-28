import { colors, images } from '@/src/theme';
import React, { useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

import { AuthContext } from '@/src/context/AuthContext';
import { commonWelcomeStyles } from '@/src/theme/style';
import NextButton from '@/src/components/NextButton';

const WelcomeScreen6 = () => {
  const { completeWelcome } = useContext(AuthContext);

  // Function to handle completing the welcome flow
  const handleComplete = () => {
    completeWelcome()
  };

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
          source={images.WelcomeScreen6}
          style={styles.illustration}
        />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFilled, { flex: 5 }]} />
          <View style={[styles.progressBarEmpty, { flex: 0 }]} />
        </View>

        {/* Title Text */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>Loving & Supportive</Text>
          <Text style={styles.Highlighttext}>Community</Text>
        </View>

        {/* Navigation Button */}
        <View style={styles.buttonContainer}>
          <NextButton onPress={handleComplete} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ...commonWelcomeStyles,
  container: {
    ...commonWelcomeStyles.container,
    backgroundColor: '#F5F5FF',
  },
  titleText: {
    fontSize: 30,
    color: colors.marron,
  },
  Highlighttext: {
    fontSize: 30,
    color: '#A694F5',
  },

});

export default WelcomeScreen6;