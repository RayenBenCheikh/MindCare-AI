import React, { useState, useEffect, useCallback } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from 'react-native';
import { setAuthToken, authEvents, isTokenExpired } from "../api/config";
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);
    const [userData, setUserData] = useState(null);
    const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

    // Sign in function
    const signIn = async (token: string, user: any) => {
        try {
            console.log("Signing in with token and user data:", {
                tokenLength: token.length,
                userData: user
            });

            // Store token
            await AsyncStorage.setItem("userToken", token);

            // Store user data
            await AsyncStorage.setItem("userData", JSON.stringify(user));

            // Update state
            setUserToken(token);
            setUserData(user);

            // Set auth token in API
            setAuthToken(token);
        } catch (e) {
            console.error("Error during sign in:", e);
        }
    };

    // Sign out function
    const signOut = useCallback(async () => {
        try {
            await AsyncStorage.removeItem("userToken");
            await AsyncStorage.removeItem("userData");

            // Clear state
            setUserToken(null);
            setUserData(null);

            // Clear API auth header
            setAuthToken(null);
        } catch (e) {
            console.error("Error during sign out:", e);
        }
    }, []);

    // Complete welcome function
    const completeWelcome = async () => {
        try {
            await AsyncStorage.setItem('hasSeenWelcome', 'true');
            setHasSeenWelcome(true);
        } catch (e) {
            console.error('Error setting welcome flag:', e);
        }
    };

    // Load initial auth state
    useEffect(() => {
        const bootstrapAsync = async () => {
            try {
                const token = await AsyncStorage.getItem("userToken");
                const userDataString = await AsyncStorage.getItem("userData");
                const welcomeComplete = await AsyncStorage.getItem('hasSeenWelcome');
                // Check if token exists and is valid
                if (token) {
                    if (isTokenExpired(token)) {
                        console.log("Stored token is expired, clearing auth data");
                        await AsyncStorage.removeItem("userToken");
                        await AsyncStorage.removeItem("userData");
                    } else {
                        setUserToken(token);
                        setAuthToken(token);

                        if (userDataString) {
                            setUserData(JSON.parse(userDataString));
                        }
                    }
                }
                // await AsyncStorage.clear(); // Clear any existing data
                setHasSeenWelcome(welcomeComplete === 'true');
            } catch (e) {
                console.error("Error loading auth state:", e);
            } finally {
                setIsLoading(false);
            }
        };

        bootstrapAsync();
    }, []);

    // Listen for auth events
    useEffect(() => {
        const handleAuthError = (error: string | { message?: string } | unknown) => {
            console.log("Auth error event received:", error);

            // Show alert to user
            Alert.alert(
                "Session Expired",
                typeof error === 'string'
                    ? error
                    : typeof error === 'object' && error !== null && 'message' in error
                        ? String(error.message)
                        : "Your session has expired. Please sign in again.",
                [{ text: "OK", onPress: () => signOut() }]
            );
        };

        // Add listener
        authEvents.addListener("auth-error", handleAuthError);

        // Cleanup
        return () => {
            authEvents.removeListener("auth-error", handleAuthError);
        };
    }, [signOut]);

    return (
        <AuthContext.Provider
            value={{
                isLoading,
                userToken,
                userData,
                hasSeenWelcome,
                signIn,
                signOut,
                completeWelcome,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;