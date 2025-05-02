import React, { useContext } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import WelcomeNavigator from './WelcomeNavigation';
import LoadingScreen3 from '../screens/Splash&loading/loadingScreen3';
import MentalNavigator from './MentalNavigator'; // Make sure this is imported

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { isLoading, userToken, hasSeenWelcome, completeWelcome } = useContext(AuthContext);

    if (isLoading) {
        return (<LoadingScreen3 />);
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!hasSeenWelcome ? (
                <Stack.Screen
                    name="Welcome"
                    component={() => <WelcomeNavigator onWelcomeComplete={completeWelcome} />}
                />
            ) : userToken ? (

                <Stack.Screen name="Mental" component={MentalNavigator} />
            ) : (
                <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
        </Stack.Navigator>
    );
};

export default RootNavigator;