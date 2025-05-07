import { createContext } from 'react';

export type AuthContextType = {
    isLoading: boolean;
    userToken: string | null;
    userData: any | null;
    hasSeenWelcome: boolean;
    signIn: (token: string, user: any) => Promise<void>;
    signOut: () => Promise<void>;
    completeWelcome: () => Promise<void>;
};

// Create with default values to prevent null checks
export const AuthContext = createContext<AuthContextType>({
    isLoading: true,
    userToken: null,
    userData: null,
    hasSeenWelcome: false,
    signIn: async () => { },
    signOut: async () => { },
    completeWelcome: async () => { },
});