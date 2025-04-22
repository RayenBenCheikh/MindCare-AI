import React from 'react';
import RootNavigator from './src/navigation/RootNavigator';
import { NavigationContainer } from '@react-navigation/native';
import GenderSelection from './src/screens/Mental Health Assessment/Gender';

export default function App() {
  return (
    //<NavigationContainer>
    // <RootNavigator />
    //</NavigationContainer>
    <GenderSelection />
  );
}