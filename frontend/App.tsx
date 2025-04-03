// App.tsx
import React from 'react';
import { AppRegistry } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator'; // Adjust path as needed

// Polyfill URL API for React Native
import { URL, URLSearchParams } from 'whatwg-url';

// Add missing static methods to URL before global assignment
const EnhancedURL = URL as any;
EnhancedURL.createObjectURL = (blob: Blob | MediaSource): string => {
  console.warn('URL.createObjectURL is not fully implemented');
  return '';
};
EnhancedURL.revokeObjectURL = (url: string): void => {
  console.warn('URL.revokeObjectURL is not fully implemented');
};
EnhancedURL.parse = (url: string, base?: string): URL | null => {
  try {
    return new URL(url, base);
  } catch {
    return null;
  }
};

global.URL = EnhancedURL;
// Cast URLSearchParams to any to avoid type incompatibility issues
const EnhancedURLSearchParams = URLSearchParams as any;
global.URLSearchParams = EnhancedURLSearchParams;

const App = () => {
  return (
    <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
  );
};

// Register the app with AppRegistry
AppRegistry.registerComponent('main', () => App);

export default App;