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

// REST API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
    updateProfile: `${API_BASE_URL}/api/auth/update-profile`,
    uploadImage: `${API_BASE_URL}/api/upload-profile-image`,
  },
  
  // Assessment endpoints
  assessments: {
    base: `${API_BASE_URL}/api/assessments`,
    latest: `${API_BASE_URL}/api/assessments/latest`,
    saveProgress: `${API_BASE_URL}/api/assessments/save-progress`,
    submit: `${API_BASE_URL}/api/assessments/submit`,
    history: `${API_BASE_URL}/api/assessments/history`,
    delete: (id: string) => `${API_BASE_URL}/api/assessments/${id}`,
  },
  
  // Medication endpoints
  medications: {
    search: `${API_BASE_URL}/api/medications/search`,
    byLetter: `${API_BASE_URL}/api/medications/byLetter`,
    test: `${API_BASE_URL}/api/medications/test`,
  },
  
  // Health scan endpoints
  health: {
    analyze: `${API_BASE_URL}/api/analyze`,
    healthCheck: `${API_BASE_URL}/health`,
  },
  
  // User endpoints
  users: {
    profile: `${API_BASE_URL}/api/users/profile`,
    updateProfile: `${API_BASE_URL}/api/users/update-profile`,
    uploadImage: `${API_BASE_URL}/api/users/upload-image`,
  },
  
  // External APIs
  external: {
    countries: "https://restcountries.com/v3.1/all?fields=name,flags",
  }
};

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