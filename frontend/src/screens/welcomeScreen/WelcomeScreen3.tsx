import NextButton from '@/src/components/NextButton';
import { colors, fonts, images } from '@/src/theme';
import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Svg, Circle, Path } from 'react-native-svg';
import { RootStackParamList } from '../../navigation/WelcomeStackNavigation';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;



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
                    stroke="white" // Ajout du contour blanc
                    strokeWidth="4" // Épaisseur du contour
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
                    stroke="white" // Ajout du contour blanc
                    strokeWidth="4" // Épaisseur du contour
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
                    stroke="white" // Ajout du contour blanc
                    strokeWidth="4" // Épaisseur du contour
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
          resizeMode="cover"
        />
        <Emoji type="sad" style={{ position: 'absolute', top: 150, left: 20 }} />
        <Emoji type="neutral" style={{ position: 'absolute', top: 100, right: 0 }} />
        <Emoji type="dead" style={{ position: 'absolute', top: 30, right: 50 }} />
      </View>

      {/* Bottom Section */}
      <View style={styles.bottomContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarFilled} />
          <View style={styles.progressBarEmpty} />
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>
            <Text style={styles.highlightedText}>Intelligent </Text>
            <Text >Mood Tracking</Text>
            {' & AI Emotion Insights'}
          </Text>
        </View>

        {/* Next Button */}
        <NextButton  onPress={() => navigation.navigate('WelcomeScreen4')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFC89E',
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
    borderWidth: 2, // Ajustez l'épaisseur de la bordure
    borderColor: colors.marron,
    borderRadius: 20, // Ajustez le rayon de la bordure
    paddingVertical: 10,
    paddingHorizontal: 30,
  },
  stepText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.marron,
  },
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    position: 'relative',
  },
  illustration: {
    width: 280, // Ajustez la largeur de l'image
    height: 300, // Ajustez la hauteur de l'image
  },
  bottomContainer: {
    flex: 3,
    backgroundColor: colors.white,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 50,
    alignItems: "center",
    width: "100%",
  
  },
  progressBarContainer: {
    flexDirection: 'row',
    width: '60%',
    height: 7,
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBarFilled: {
    flex: 3,
    backgroundColor: colors.marron,
  },
  progressBarEmpty: {
    flex: 2,
    backgroundColor: '#E8DDD9',
  },
  titleContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  titleText: {
    fontSize: 30,
    fontWeight: "bold",
    color: colors.marron,
    textAlign: 'center',
  },
  highlightedText: {
    color: colors.orange,
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.marron,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 24,
  },
});