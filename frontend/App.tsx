// App.tsx
import React from 'react';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator'; // Adjust path as needed
import WelcomeStackNavigation from './src/navigation/WelcomeStackNavigation';


export default function App  () {
  return (
    
      <WelcomeStackNavigation />
  );
};

//