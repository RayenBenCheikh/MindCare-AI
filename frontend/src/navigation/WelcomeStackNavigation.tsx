// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WelcomeScreen1 from '../screens/WelcomeScreen/WelcomeScreen1';
import WelcomeScreen2 from '../screens/WelcomeScreen/WelcomeScreen2'; 
import WelcomeScreen3 from '../screens/WelcomeScreen/WelcomeScreen3'; 
import WelcomeScreen4 from '../screens/WelcomeScreen/WelcomeScreen4'; 
import WelcomeScreen5 from '../screens/WelcomeScreen/WelcomeScreen5'; 
import WelcomeScreen6 from '../screens/WelcomeScreen/WelcomeScreen6'; 
import SignIn from '../screens/Sign In & Sign Up/SignIn';
export type RootStackParamList = {
    WelcomeScreen1: undefined;
    WelcomeScreen2: undefined;
    WelcomeScreen3: undefined;
    WelcomeScreen4: undefined;
    WelcomeScreen5: undefined;
    WelcomeScreen6: undefined;
    SignIn: undefined;
  };
  
const Stack = createNativeStackNavigator();

const WelcomeStackNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="WelcomeScreen1">
        <Stack.Screen name="WelcomeScreen1" component={WelcomeScreen1} options={{ headerShown: false }} />
        <Stack.Screen name="WelcomeScreen2" component={WelcomeScreen2} options={{ headerShown: false }} />
        <Stack.Screen name="WelcomeScreen3" component={WelcomeScreen3} options={{ headerShown: false }} />
        <Stack.Screen name="WelcomeScreen4" component={WelcomeScreen4} options={{ headerShown: false }} />
        <Stack.Screen name="WelcomeScreen5" component={WelcomeScreen5} options={{ headerShown: false }} />
        <Stack.Screen name="WelcomeScreen6" component={WelcomeScreen6} options={{ headerShown: false }} />
        <Stack.Screen name="SignIn" component={SignIn} options={{ headerShown: false }} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default WelcomeStackNavigation;