import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fonts } from '@/src/theme'; // Assurez-vous que le chemin est correct



interface ButtonPrimaryProps {
  title: string;
  onPress: () => void;
}

export default function ButtonPrimary({ title, onPress }: ButtonPrimaryProps) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.marron,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  buttonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: fonts.extraBold,
  },
});