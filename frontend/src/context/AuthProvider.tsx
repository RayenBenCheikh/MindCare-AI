import React, { useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from './AuthContext';

type Props = {
    children: ReactNode;
};

const AuthProvider = ({ children }: Props) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

    // Load data when component mounts
    useEffect(() => {
        const loadData = async () => {
            try {
                const token = await AsyncStorage.getItem('userToken');
                const welcomeSeen = await AsyncStorage.getItem('hasSeenWelcome');

                setUserToken(token);
                setHasSeenWelcome(welcomeSeen === 'true');
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
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('user', JSON.stringify(user));
            setUserToken(token);
        } catch (e) {
            console.error('Error saving auth data:', e);
        }
    };

    // Sign out function
    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('user');
            setUserToken(null);
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
        completeWelcome
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;