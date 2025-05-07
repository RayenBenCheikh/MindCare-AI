export const API_BASE_URL = "http://10.0.2.2:5000"; // Android emulator
// For iOS simulator use: "http://localhost:5000"
export const API_ENDPOINTS = {
  assessments: `${API_BASE_URL}/api/assessments`,
  login: `${API_BASE_URL}/api/auth/login`,
  register: `${API_BASE_URL}/api/auth/register`,
};