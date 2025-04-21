import React, { useState, useEffect, createContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import your navigators
import AuthNavigator from './AuthNavigator';
import WelcomeNavigator from './WelcomeNavigation';

// Auth context definition
type AuthContextType = {
    signIn: (data: { username: string; password: string }) => Promise<void>;
    signOut: () => Promise<void>;
    completeWelcome: () => Promise<void>;
};

// Create auth context
export const AuthContext = createContext<AuthContextType>({
    signIn: async () => { },
    signOut: async () => { },
    completeWelcome: async () => { }
});

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

    useEffect(() => {
        // Check authentication status and welcome screen status
        const bootstrapAsync = async () => {
            try {
                // Check if user has completed welcome flow
                const welcomeValue = await AsyncStorage.getItem('hasSeenWelcome');
                setHasSeenWelcome(welcomeValue === 'true');

                // Check if user is authenticated
                const token = await AsyncStorage.getItem('userToken');
                setUserToken(token);
            } catch (e) {
                console.error('Failed to load authentication state:', e);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    // Authentication functions that any screen can use
    const authContext = {
        signIn: async (data: { username: string; password: string }) => {
            // In a real app, you'd call an API here
            const token = 'dummy-auth-token';
            try {
                await AsyncStorage.setItem('userToken', token);
                setUserToken(token);
            } catch (e) {
                console.error('Failed to sign in:', e);
            }
        },
        signOut: async () => {
            try {
                await AsyncStorage.removeItem('userToken');
                setUserToken(null);
            } catch (e) {
                console.error('Failed to sign out:', e);
            }
        },
        completeWelcome: async () => {
            try {
                await AsyncStorage.setItem('hasSeenWelcome', 'true');
                setHasSeenWelcome(true);
            } catch (e) {
                console.error('Failed to complete welcome:', e);
            }
        }
    };

    if (isLoading) {
        // Return a loading screen
        return null;
    }

    return (
        <AuthContext.Provider value={authContext}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!hasSeenWelcome ? (
                    <Stack.Screen
                        name="Welcome"
                        component={() => <WelcomeNavigator onWelcomeComplete={authContext.completeWelcome} />}
                        initialParams={{ onWelcomeComplete: authContext.completeWelcome }}
                    />
                ) : userToken ? (
                    <Stack.Screen name="Main" component={AuthNavigator} />
                ) : (
                    <Stack.Screen name="Auth" component={AuthNavigator} />
                )}
            </Stack.Navigator>
        </AuthContext.Provider>
    );
};

export default RootNavigator;