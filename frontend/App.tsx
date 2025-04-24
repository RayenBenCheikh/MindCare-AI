import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { NavigationContainer } from '@react-navigation/native';
import GenderSelection from './src/screens/Mental Health Assessment/Gender';
import AuthProvider from './src/context/AuthProvider';

export default function App() {
  return (
    <NavigationContainer>
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  </NavigationContainer>
    // <GenderSelection />
  );
}