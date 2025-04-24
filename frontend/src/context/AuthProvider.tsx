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

  useEffect(() => {
    const loadData = async () => {
        //await AsyncStorage.clear()
      try {
        const welcome = await AsyncStorage.getItem('hasSeenWelcome');
        const token = await AsyncStorage.getItem('userToken');
        setHasSeenWelcome(welcome === 'true');
        setUserToken(token);
      } catch (e) {
        console.error('Error loading auth state:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  /**
   * Logs in a user, given a username and password.
   *
   * @param {Object} data - An object containing the username and password.
   * @param {string} data.username - The username.
   * @param {string} data.password - The password.
   *
   * @throws {Error} - If there is an error storing the user token in AsyncStorage.
   *
   * @returns {Promise<void>} - A promise that resolves when the user is logged in.
   */
  const signIn = async (_data: { username: string; password: string }) => {
    const token = 'dummy-auth-token';
    try {
      await AsyncStorage.setItem('userToken', token);
      setUserToken(token);
    } catch (e) {
      console.error('Sign-in error:', e);
    }
  };

  /**
   * Removes the user token from AsyncStorage and sets the userToken state to null
   *
   * @throws {Error} - If there is an error removing the user token from AsyncStorage
   */
  const signOut = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUserToken(null);
    } catch (e) {
      console.error('Sign-out error:', e);
    }
  };

  /**
   * Marks the welcome sequence as complete in AsyncStorage.
   *
   * @throws {Error} - If there is an error storing the welcome complete flag in AsyncStorage.
   *
   * @returns {Promise<void>} - A promise that resolves when the flag has been written.
   */
  const completeWelcome = async () => {
    try {
      await AsyncStorage.setItem('hasSeenWelcome', 'true');
      setHasSeenWelcome(true);
    } catch (e) {
      console.error('Welcome complete error:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, completeWelcome, isLoading, userToken, hasSeenWelcome }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;