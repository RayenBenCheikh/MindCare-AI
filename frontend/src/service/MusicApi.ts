import axios from "axios";
import { API_BASE_URL } from "../api/config";

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverImage: string;
  previewUrl?: string;
  jamendoUrl: string;
  category: string;
  popularity: number;
  type: "track";
  description?: string;
}

class LocalMusicAPI {
  // Fetch all tracks or by categories from your MongoDB database
  static async fetchWellnessMusic(
    categories: string[] = [
      "meditation",
      "sleep",
      "focus",
      "nature",
      "anxiety",
      "stress",
    ]
  ): Promise<MusicTrack[]> {
    try {
      console.log("🔗 LocalMusicAPI: Starting fetch...");
      console.log("🔗 API_BASE_URL:", API_BASE_URL);
      console.log("🔗 Categories:", categories);

      // Test the endpoint URL
      const endpoint = `${API_BASE_URL}/api/music/tracks`;
      console.log("🔗 Full endpoint URL:", endpoint);

      // Make the request
      console.log("🔗 Making axios request...");
      const response = await axios.get(endpoint, {
        timeout: 10000, // 10 second timeout
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("🔗 Response status:", response.status);
      console.log("🔗 Response headers:", response.headers);
      console.log("🔗 Response data:", response.data);
      console.log("🔗 Response data length:", response.data?.length);

      if (!response.data) {
        console.error("🔗 No data in response");
        return [];
      }

      if (!Array.isArray(response.data)) {
        console.error(
          "🔗 Response data is not an array:",
          typeof response.data
        );
        return [];
      }

      console.log(
        `🔗 LocalMusicAPI: Successfully fetched ${response.data.length} tracks`
      );
      return response.data;
    } catch (error: any) {
      console.error("🔗 LocalMusicAPI: Detailed error info:");
      console.error("🔗 Error message:", error.message);
      console.error("🔗 Error code:", error.code);
      console.error("🔗 Error config:", error.config?.url);

      if (error.response) {
        console.error("🔗 Response status:", error.response.status);
        console.error("🔗 Response data:", error.response.data);
        console.error("🔗 Response headers:", error.response.headers);
      } else if (error.request) {
        console.error("🔗 Request made but no response received");
        console.error("🔗 Request:", error.request);
      } else {
        console.error("🔗 Error setting up request:", error.message);
      }

      return [];
    }
  }

  // Simple test function to check if backend is reachable
  static async testConnection(): Promise<boolean> {
    try {
      console.log("🧪 Testing backend connection...");
      const endpoint = `${API_BASE_URL}/api/music/debug`;
      console.log("🧪 Testing endpoint:", endpoint);

      const response = await axios.get(endpoint, { timeout: 5000 });
      console.log("🧪 Connection test successful:", response.status);
      console.log("🧪 Backend response:", response.data);
      return true;
    } catch (error: any) {
      console.error("🧪 Connection test failed:", error.message);
      return false;
    }
  }
}

export default LocalMusicAPI;
