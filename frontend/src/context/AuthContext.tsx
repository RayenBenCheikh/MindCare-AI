import { createContext } from 'react';

export type AuthContextType = {
  signIn: (data: { username: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  completeWelcome: () => Promise<void>;
  isLoading: boolean;
  userToken: string | null;
  hasSeenWelcome: boolean;
};

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);