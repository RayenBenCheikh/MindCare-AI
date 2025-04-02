
// app/index.tsx
import React from 'react';
import WelcomeScreen2 from '../src/screens/WelcomeScreen/WelcomeScreen2';
import { NavigationContainer } from '@react-navigation/native';
import WelcomeStackNavigation from '@/src/navigation/WelcomeStackNavigation';
import WelcomeScreen3 from '../src/screens/WelcomeScreen/WelcomeScreen3';
import WelcomeScreen4 from '@/src/screens/WelcomeScreen/WelcomeScreen4';
import WelcomeScreen6 from '@/src/screens/WelcomeScreen/WelcomeScreen6';
import SignIn from '@/src/screens/Sign In & Sign Up/SignIn';



export default function Index() {
  return  (
   // <NavigationContainer>
   //   <WelcomeStackNavigation />
   // </NavigationContainer> 
   <SignIn/>
  )
}
