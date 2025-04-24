import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import WelcomeNavigator from './WelcomeNavigation';
import { View, ActivityIndicator } from 'react-native';


const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoading, userToken, hasSeenWelcome, completeWelcome } = useContext(AuthContext);

  if (isLoading) {
    // TODO: Change this with actual loading screen
    return (<View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
      }}>
    <ActivityIndicator size="large" color="#4A90E2" />
  </View>);
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!hasSeenWelcome ? (
        <Stack.Screen
          name="Welcome"
          component={() => <WelcomeNavigator onWelcomeComplete={completeWelcome} />}
        />
      ) : userToken ? (
        <Stack.Screen name="Main" component={AuthNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;