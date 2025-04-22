// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GenderSelection from '../screens/Mental Health Assessment/Gender';
import AgeSelection from '../screens/Mental Health Assessment/AgeSelection';
import WeightSelection from '../screens/Mental Health Assessment/WeightSelection';

const Stack = createNativeStackNavigator();
export type RootStackParamList = {
    AgeSelection: undefined;
    GenderSelection: undefined;
    WeightSelection: undefined;
    // Add other screens as needed
};
const MentalNavigator = () => {
    return (

        <Stack.Navigator initialRouteName="GenderSelection">
            <Stack.Screen name="GenderSelection" component={GenderSelection} options={{ headerShown: false }} />
            <Stack.Screen name="AgeSelection" component={AgeSelection} options={{ headerShown: false }} />
            <Stack.Screen name="WeightSelection" component={WeightSelection} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

export default MentalNavigator;