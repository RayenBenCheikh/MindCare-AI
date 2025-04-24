// navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GenderSelection from '../screens/Mental Health Assessment/Gender';
import AgeSelection from '../screens/Mental Health Assessment/AgeSelection';
import WeightSelection from '../screens/Mental Health Assessment/WeightSelection';
import HeightSelection from '../screens/Mental Health Assessment/HeightSelection';
import MoodSelection from '../screens/Mental Health Assessment/MoodSelection';
import SleepSelection from '../screens/Mental Health Assessment/SleepSelection';
import HelpSelection from '../screens/Mental Health Assessment/HelpSelection';

const Stack = createNativeStackNavigator();
export type RootStackParamList = {
    AgeSelection: undefined;
    GenderSelection: undefined;
    WeightSelection: undefined;
    HeigherSelection: undefined;
    MoodSelection: undefined;
    SleepSelection: undefined;
    HelpSelection: undefined;
    // Add other screens as needed
};
const MentalNavigator = () => {
    return (

        <Stack.Navigator initialRouteName="GenderSelection">
            <Stack.Screen name="GenderSelection" component={GenderSelection} options={{ headerShown: false }} />
            <Stack.Screen name="AgeSelection" component={AgeSelection} options={{ headerShown: false }} />
            <Stack.Screen name="WeightSelection" component={WeightSelection} options={{ headerShown: false }} />
            <Stack.Screen name="HeigherSelection" component={HeightSelection} options={{ headerShown: false }} />
            <Stack.Screen name="MoodSelection" component={MoodSelection} options={{ headerShown: false }} />
            <Stack.Screen name="SleepSelection" component={SleepSelection} options={{ headerShown: false }} />
            <Stack.Screen name="HelpSelection" component={HelpSelection} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

export default MentalNavigator;