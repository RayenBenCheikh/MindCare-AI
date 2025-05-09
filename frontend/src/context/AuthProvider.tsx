import React, { useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';
import { setAuthToken } from '../api/config';

type Props = {
    children: ReactNode;
};

const AuthProvider = ({ children }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
    const [userData, setUserData] = useState<any | null>(null);
    useEffect(() => {
        // Set the token whenever it changes
        if (userToken) {
            console.log('Setting auth token from context');
            setAuthToken(userToken);
        } else {
            setAuthToken(null);
        }
    }, [userToken]);
    // Load data when component mounts
    useEffect(() => {
        const loadData = async () => {
            try {
                await AsyncStorage.clear();
                const token = await AsyncStorage.getItem('@auth_token');

                const welcomeSeen = await AsyncStorage.getItem('hasSeenWelcome');
                const userDataString = await AsyncStorage.getItem('@user_data');
                setUserToken(token);
                setHasSeenWelcome(welcomeSeen === 'true');

                if (userDataString) {
                    setUserData(JSON.parse(userDataString));
                }
            } catch (e) {
                console.error('Error loading auth data:', e);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Sign in function
    const signIn = async (token: string, user: any) => {
        try {
            await AsyncStorage.setItem('@auth_token', token);
            await AsyncStorage.setItem('@user_data', JSON.stringify(user)); // Store user data
            setUserToken(token);
            setUserData(user); // Set user data in state
        } catch (e) {
            console.log('Error during sign in:', e);
        }
    };

    // Sign out function
    const signOut = async () => {
        try {
            // Use consistent key names
            await AsyncStorage.removeItem('@auth_token');
            await AsyncStorage.removeItem('@user_data');
            setUserToken(null);
            setUserData(null); // Also clear user data from state
        } catch (e) {
            console.error('Error removing auth data:', e);
        }
    };

    // Complete welcome function
    const completeWelcome = async () => {
        try {
            await AsyncStorage.setItem('hasSeenWelcome', 'true');
            setHasSeenWelcome(true);
        } catch (e) {
            console.error('Error setting welcome flag:', e);
        }
    };

    // Create context value object
    const contextValue = {
        isLoading,
        userToken,
        hasSeenWelcome,
        signIn,
        signOut,
        completeWelcome,
        userData,

    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;