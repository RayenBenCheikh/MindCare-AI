import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AuthProvider from './src/context/AuthProvider';
import RootNavigator from './src/navigation/RootNavigator';
import SignIn from './src/screens/Sign In & Sign Up/SignIn';

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}