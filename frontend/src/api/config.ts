import axios from "axios";
import { Platform } from "react-native";
import { EventEmitter } from "events";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Event emitter for auth events
export const authEvents = new EventEmitter();

// API URLs remain the same
export const API_URLS = {
  local: "http://192.168.1.4:5000",
  android: "http://10.0.2.2:5000",
  ios: "http://192.168.1.4:5000",
  production: "https://api.mindcare-ai.com",
};

export const VITAL_SIGNS_URLS = {
  local: "http://192.168.1.4:5001",
  android: "http://10.0.2.2:5001",
  ios: "http://192.168.1.4:5001",
  production: "https://vitals.mindcare-ai.com",
};

// Current environment
const CURRENT_ENV: "local" | "android" | "ios" | "production" =
  Platform.OS === "ios" ? "ios" : "android";

export const API_BASE_URL = API_URLS[CURRENT_ENV];
export const VITAL_SIGNS_URL = VITAL_SIGNS_URLS[CURRENT_ENV];

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Enhanced token expiration check
export const isTokenExpired = (token: string): boolean => {
  try {
    if (!token) return true;

    // Split the token and get the payload part
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    const base64Url = parts[1];
    // Convert base64 to string (using base-64 for React Native compatibility)
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = atob(base64);
    const payload = JSON.parse(jsonPayload);

    // Check if token has expired
    const currentTime = Math.floor(Date.now() / 1000);

    if (!payload.exp) return true;
    return payload.exp < currentTime;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true; // Assume expired if we can't check
  }
};

// Request interceptor - Check token before sending requests
api.interceptors.request.use(
  async (config) => {
    // Log request details in development
    console.log("Request headers:", config.headers);

    // Get token from storage and check if it's expired
    try {
      const token = await AsyncStorage.getItem("userToken");

      if (token) {
        // Check if token is expired before even making the request
        if (isTokenExpired(token)) {
          console.log("Token expired before request, emitting auth-error");
          authEvents.emit("auth-error", "Token expired");

          // Clear token from storage
          await AsyncStorage.removeItem("userToken");
          await AsyncStorage.removeItem("userData");

          // Allow request to continue - the server will return 401
          // and our response interceptor will handle it
        }
      }
    } catch (err) {
      console.error("Error in token pre-check:", err);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 Unauthorized
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Check if token exists
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          console.log("Received 401, emitting auth-error event");

          // Emit auth error event
          authEvents.emit("auth-error", {
            message: "Your session has expired. Please sign in again.",
            status: 401,
            originalUrl: originalRequest.url,
          });

          // Clear tokens from storage
          await AsyncStorage.removeItem("userToken");
          await AsyncStorage.removeItem("userData");
        }
      } catch (err) {
        console.error("Error handling token expiration:", err);
      }
    }

    return Promise.reject(error);
  }
);

// Function to set auth token
export const setAuthToken = (token: string | null) => {
  if (token) {
    console.log("Setting auth token on API instance");
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    console.log("Removing auth token from API instance");
    delete api.defaults.headers.common["Authorization"];
  }
};
