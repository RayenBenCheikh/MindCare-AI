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
import HealthGoal from '../screens/Mental Health Assessment/HealthGoal';
import MedicationSelection from '../screens/Mental Health Assessment/MedicationSelection';
import MedicamentSelection from '../screens/Mental Health Assessment/MedicamentSelection';

const Stack = createNativeStackNavigator();
export type RootStackParamList = {
    HealthGoal: undefined;
    AgeSelection: undefined;
    GenderSelection: undefined;
    WeightSelection: undefined;
    HeightSelection: undefined;
    MoodSelection: undefined;
    SleepSelection: undefined;
    HelpSelection: undefined;
    MedicationSelection: undefined;
    MedicamentSelection: undefined;
    AssessmentCompleted: undefined;
    // Add other screens as needed
};
const MentalNavigator = () => {
    return (

        <Stack.Navigator initialRouteName="HealthGoal">
            <Stack.Screen name="HealthGoal" component={HealthGoal} options={{ headerShown: false }} />
            <Stack.Screen name="GenderSelection" component={GenderSelection} options={{ headerShown: false }} />
            <Stack.Screen name="AgeSelection" component={AgeSelection} options={{ headerShown: false }} />
            <Stack.Screen name="WeightSelection" component={WeightSelection} options={{ headerShown: false }} />
            <Stack.Screen name="HeightSelection" component={HeightSelection} options={{ headerShown: false }} />
            <Stack.Screen name="MoodSelection" component={MoodSelection} options={{ headerShown: false }} />
            <Stack.Screen name="SleepSelection" component={SleepSelection} options={{ headerShown: false }} />
            <Stack.Screen name="HelpSelection" component={HelpSelection} options={{ headerShown: false }} />
            <Stack.Screen name="MedicationSelection" component={MedicationSelection} options={{ headerShown: false }} />
            <Stack.Screen name="MedicamentSelection" component={MedicamentSelection} options={{ headerShown: false }} />
        </Stack.Navigator>
    );
};

export default MentalNavigator;