import NextButton from '@/src/components/NextButton';
import { colors, fonts, images } from '@/src/theme';
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Svg, Circle, Path } from 'react-native-svg';
import { WelcomeStackParamList } from '../../navigation/WelcomeNavigation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { commonWelcomeStyles } from '@/src/theme/style';

type NavigationProp = NativeStackNavigationProp<WelcomeStackParamList>;

export default function WelcomeScreen3() {
  const navigation = useNavigation<NavigationProp>();
  const Emoji = ({ type, style }: { type: 'sad' | 'neutral' | 'dead', style?: any }) => {
    switch (type) {
      case 'sad':
        return (
          <View style={style}>
            <Svg width="60" height="60" viewBox="0 0 50 50">
              <Circle
                cx="25"
                cy="25"
                r="20"
                fill="#ED7E1C"
                stroke="white"
                strokeWidth="4"
              />
              <Circle cx="15" cy="20" r="3" fill="black" />
              <Circle cx="35" cy="20" r="3" fill="black" />
              <Path d="M15 35 Q25 25 35 35" stroke="black" strokeWidth="2" fill="none" />
            </Svg>
          </View>
        );
      case 'neutral':
        return (
          <View style={style}>
            <Svg width="90" height="90" viewBox="0 0 50 50">
              <Circle
                cx="25"
                cy="25"
                r="20"
                fill="#C0A091"
                stroke="white"
                strokeWidth="4"
              />
              <Circle cx="15" cy="20" r="3" fill="black" />
              <Circle cx="35" cy="20" r="3" fill="black" />
              <Path d="M15 35 L35 35" stroke="black" strokeWidth="2" />
            </Svg>
          </View>
        );
      case 'dead':
        return (
          <View style={style}>
            <Svg width="60" height="60" viewBox="0 0 50 50">
              <Circle
                cx="25"
                cy="25"
                r="20"
                fill="#C2B1FF"
                stroke="white"
                strokeWidth="4"
              />
              <Path d="M15 20 L20 25 L15 30" stroke="black" strokeWidth="2" />
              <Path d="M35 20 L30 25 L35 30" stroke="black" strokeWidth="2" />
              <Path d="M15 35 L35 35" stroke="black" strokeWidth="2" />
            </Svg>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Step Two Indicator */}
      <View style={styles.stepButtonContainer}>
        <TouchableOpacity style={styles.stepButton}>
          <Text style={styles.stepText}>Step Two</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.illustrationContainer}>
        <Image
          source={images.WelcomeScreen3}
          style={styles.illustration}
        />
        <Emoji type="sad" style={{ position: 'absolute', top: '45%', left: '5%' }} />
        <Emoji type="neutral" style={{ position: 'absolute', top: '25%', right: '5%' }} />
        <Emoji type="dead" style={{ position: 'absolute', top: '10%', right: '20%' }} />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFilled, { flex: 2 }]} />
          <View style={[styles.progressBarEmpty, { flex: 3 }]} />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>
            <Text style={styles.highlightedText}>Intelligent </Text>
            <Text>Mood Tracking</Text>
            {' & AI Emotion Insights'}
          </Text>
        </View>

        {/* Next Button */}
        <View style={styles.buttonContainer}>
          <NextButton onPress={() => navigation.navigate('WelcomeScreen4')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonWelcomeStyles,
  container: {
    ...commonWelcomeStyles.container,
    backgroundColor: '#FFC89E', // Keep unique background color
  },
  titleText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: colors.marron,
    textAlign: 'center',
    lineHeight: 38,
  },
  highlightedText: {
    color: colors.orange,
  },
});