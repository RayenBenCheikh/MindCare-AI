import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { NavigationContainer } from '@react-navigation/native';
import GenderSelection from './src/screens/Mental Health Assessment/Gender';
import AuthProvider from './src/context/AuthProvider';
import WelcomeNavigator from './src/navigation/WelcomeNavigation';
import MentalNavigator from './src/navigation/MentalNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </NavigationContainer>
  );
}
