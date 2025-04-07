// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignUpScreen from '../screens/Sign In & Sign Up/SignUp'; // Adjust path as needed
import SignInScreen from '../screens/Sign In & Sign Up/SignIn'; // You'll create this later
import ForgotPassword  from '../screens/Sign In & Sign Up/ForgotPassword';

// Define the navigation stack's param list
export type RootStackParamList = {
    SignUp: undefined;
    SignIn: undefined;
    ForgotPassword: undefined;
  };
const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SignIn">
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;