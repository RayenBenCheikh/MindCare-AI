import axios from 'axios'; // Use import instead of require
import { Platform } from 'react-native';
// Base API URLs for different environments
export const API_URLS = {
  local: "http://localhost:5000",
  android: "http://10.0.2.2:5000", // Android emulator uses 10.0.2.2 to access localhost
  ios: "http://localhost:5000",    // iOS simulator uses localhost directly
  // Add production URL when ready
  production: "https://api.mindcare-ai.com",
};

// Current environment
const CURRENT_ENV: "local" | "android" | "ios" | "production" = 
  Platform.OS === 'ios' ? "ios" : "android";

// Root API URL based on environment
export const API_BASE_URL = API_URLS[CURRENT_ENV];



// Create a single axios instance to use throughout the app
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000,
});

// Add auth token to requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    console.log('Setting auth token on API instance');
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Verify the token was set
    console.log('Authorization header set:', api.defaults.headers.common['Authorization']);
  } else {
    console.log('Removing auth token from API instance');
    delete api.defaults.headers.common['Authorization'];
  }
};

// Add an interceptor to log requests
api.interceptors.request.use(request => {
  console.log('Request headers:', request.headers);
  return request;
});