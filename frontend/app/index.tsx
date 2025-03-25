
// app/index.tsx
import React from 'react';
import WelcomeScreen2 from '../src/screens/WelcomeScreen/WelcomeScreen2';
import { NavigationContainer } from '@react-navigation/native';
import WelcomeStackNavigation from '@/src/navigation/WelcomeStackNavigation';
import WelcomeScreen3 from '../src/screens/WelcomeScreen/WelcomeScreen3';



export default function Index() {
  return  (
   // <NavigationContainer>
   //   <WelcomeStackNavigation />
   // </NavigationContainer> 
   <WelcomeScreen3/>
  )
}
