import axios from "axios";
import { API_BASE_URL } from "@/src/api/config";

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
        categories: string[] = ["meditation", "sleep", "focus", "nature", "anxiety", "stress"]
    ): Promise<MusicTrack[]> {
        try {
            console.log('LocalMusicAPI: Fetching music from local database...');

            // If no specific categories, get all tracks
            if (categories.length === 0) {
                const response = await axios.get(`${API_BASE_URL}/api/music/tracks`);
                console.log(`LocalMusicAPI: Fetched ${response.data.length} total tracks`);
                return response.data;
            }

            // Fetch tracks for each category
            const allTracks: MusicTrack[] = [];
            for (const category of categories) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/music/category/${category}`);
                    console.log(`LocalMusicAPI: Fetched ${response.data.length} tracks for ${category}`);
                    allTracks.push(...response.data);
                } catch (error) {
                    console.error(`LocalMusicAPI: Error fetching ${category} tracks:`, error);
                    continue;
                }
            }

            // Remove duplicates by id
            const uniqueTracks = Array.from(
                new Map(allTracks.map((t) => [t.id, t])).values()
            );

            console.log(`LocalMusicAPI: Total unique tracks: ${uniqueTracks.length}`);
            return uniqueTracks;
        } catch (error) {
            console.error('LocalMusicAPI: Error fetching music from database:', error);
            return [];
        }
    }

    // Fetch tracks by specific category
    static async fetchTracksByCategory(category: string): Promise<MusicTrack[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/music/category/${category}`);
            console.log(`LocalMusicAPI: Fetched ${response.data.length} tracks for category ${category}`);
            return response.data;
        } catch (error) {
            console.error(`LocalMusicAPI: Error fetching ${category} tracks:`, error);
            return [];
        }
    }

    // Search tracks
    static async searchTracks(query: string, category?: string): Promise<MusicTrack[]> {
        try {
            const params: any = { q: query };
            if (category) params.category = category;

            const response = await axios.get(`${API_BASE_URL}/api/music/search`, { params });
            return response.data;
        } catch (error) {
            console.error('LocalMusicAPI: Error searching tracks:', error);
            return [];
        }
    }

    // Get all tracks (simple endpoint)
    static async getAllTracks(): Promise<MusicTrack[]> {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/music/tracks`);
            console.log(`LocalMusicAPI: Fetched ${response.data.length} total tracks`);
            return response.data;
        } catch (error) {
            console.error('LocalMusicAPI: Error fetching all tracks:', error);
            return [];
        }
    }
}

export default LocalMusicAPI;