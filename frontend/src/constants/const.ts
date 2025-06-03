import { API_BASE_URL } from "../api/config";

export const TIMEZONE = "Africa/Tunis";
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
  music: {
    tracks: `${API_BASE_URL}/api/music/tracks`,
    category: (category: string) =>
      `${API_BASE_URL}/api/music/category/${category}`,
    stream: (id: string) => `${API_BASE_URL}/api/music/stream/${id}`,
    search: `${API_BASE_URL}/api/music/search`,
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
  },
};
