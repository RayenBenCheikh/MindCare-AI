import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SignIn from '../screens/Sign In & Sign Up/SignIn';
import WelcomeScreen1 from '../screens/welcomeScreen/WelcomeScreen1';
import WelcomeScreen2 from '../screens/welcomeScreen/welcomeScreen2';
import WelcomeScreen3 from '../screens/welcomeScreen/WelcomeScreen3';
import WelcomeScreen4 from '../screens/welcomeScreen/WelcomeScreen4';
import WelcomeScreen5 from '../screens/welcomeScreen/WelcomeScreen5';
import WelcomeScreen6 from '../screens/welcomeScreen/WelcomeScreen6';

export type WelcomeStackParamList = {
  WelcomeScreen1: undefined;
  WelcomeScreen2: undefined;
  WelcomeScreen3: undefined;
  WelcomeScreen4: undefined;
  WelcomeScreen5: undefined;
  WelcomeScreen6: { onComplete: () => void };
  SignIn: undefined;
};

interface WelcomeStackProps {
  onWelcomeComplete: () => void;
}

const Stack = createNativeStackNavigator<WelcomeStackParamList>();

const WelcomeNavigator = ({ onWelcomeComplete }: WelcomeStackProps) => {
  return (
    <Stack.Navigator initialRouteName="WelcomeScreen1">
      <Stack.Screen
        name="WelcomeScreen1"
        component={WelcomeScreen1}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WelcomeScreen2"
        component={WelcomeScreen2}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WelcomeScreen3"
        component={WelcomeScreen3}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WelcomeScreen4"
        component={WelcomeScreen4}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WelcomeScreen5"
        component={WelcomeScreen5}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WelcomeScreen6"
        component={WelcomeScreen6}
        options={{ headerShown: false }}
        initialParams={{ onComplete: onWelcomeComplete }}
      />
      <Stack.Screen
        name="SignIn"
        component={SignIn}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default WelcomeNavigator;