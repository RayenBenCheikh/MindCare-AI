import React, { useContext, useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthContext } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import WelcomeNavigator from './WelcomeNavigation';
import LoadingScreen3 from '../screens/Splash&loading/loadingScreen3';
import MentalNavigator from './MentalNavigator';
import TabNavigator from './TabBarNavigation';
import { API_ENDPOINTS } from '@/src/constants/const';
import { api } from '../api/config';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const { isLoading, userToken, hasSeenWelcome, completeWelcome, userData } = useContext(AuthContext);
    const [assessmentLoaded, setAssessmentLoaded] = useState(false);
    const [hasAssessment, setHasAssessment] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAssessment = async () => {
            if (userToken) {
                try {
                    const res = await api.get(API_ENDPOINTS.assessments.latest, {
                        headers: { Authorization: `Bearer ${userToken}` }
                    });
                    // Accept assessment as complete if isSubmitted or completedAt is present
                    setHasAssessment(
                        !!res.data &&
                        !!res.data.assessment &&
                        res.data.assessment.isSubmitted === true &&
                        !!res.data.assessment.completedAt
                    );
                } catch (e) {
                    setHasAssessment(false);
                } finally {
                    setAssessmentLoaded(true);
                }
            } else {
                setAssessmentLoaded(true);
            }
        };
        checkAssessment();
    }, [userToken]);

    if (isLoading || !assessmentLoaded) {
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
                hasAssessment ? (
                    <Stack.Screen name="TabNavigator" component={TabNavigator} options={{ headerShown: false }} />
                ) : (
                    <Stack.Screen name="Mental" component={MentalNavigator} />
                )
            ) : (
                <Stack.Screen name="Auth" component={AuthNavigator} />
            )}
        </Stack.Navigator>
    );
};

export default RootNavigator;