import { images } from '@/src/theme';
import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
const WelcomeScreen3 = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.stepText}>Step Two</Text>
      
      <View style={styles.moodContainer}>
        {/* Your woman image */}
       <Image 
          source={require(images.WelcomeScreen3)} 
          style={styles.womanImage}
        />
        
        {/* Mood Faces */}
        <View style={styles.emojiFacesContainer}>
          <View style={styles.emojiContainer}>
            <Image 
              source={require(images.sad)} 
              style={styles.emojiImage}
            />
          </View>
          
          <View style={styles.emojiContainer}>
            <Image 
              source={require(images.neutral)} 
              style={styles.emojiImage}
            />
          </View>
          
          <View style={styles.emojiContainer}>
            <Image 
              source={require(images.dead)} 
              style={styles.emojiImage}
            />
          </View>
        </View>
      </View>
      
      <Text style={styles.bottomText}>Intelligent Mood Tracking & AI Emotion Insights</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3', // Matching background color
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  moodContainer: {
    position: 'relative',
    alignItems: 'center',
  },
  womanImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
  },
  emojiFacesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    position: 'absolute',
    top: '20%', // Adjust based on your image positioning
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiImage: {
    width: 40,
    height: 40,
  },
  bottomText: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
  },
});

export default WelcomeScreen3;