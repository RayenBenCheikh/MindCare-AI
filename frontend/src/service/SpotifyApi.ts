import axios from "axios";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  duration_ms: number;
  preview_url: string | null;
  external_urls: {
    spotify: string;
  };
  popularity: number;
}

interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string | null;
  images: Array<{ url: string; height: number; width: number }>;
  tracks: {
    total: number;
  };
  external_urls: {
    spotify: string;
  };
  owner: {
    display_name: string;
  };
}

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  coverImage: string;
  previewUrl?: string;
  spotifyUrl: string;
  category: "meditation" | "sleep" | "focus" | "nature" | "anxiety" | "stress";
  popularity: number;
  type: "track" | "playlist";
  description?: string;
}

class SpotifyAPI {
  private static readonly CLIENT_ID = "b63170452a804514961540b7e5aee51a";
  private static readonly CLIENT_SECRET = "97eaeac8a3e84c71842b58a3c8656a7c";
  private static accessToken: string | null = null;
  private static tokenExpiry: number = 0;

  // Get Spotify access token
  private static async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        "https://accounts.spotify.com/api/token",
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(
              `${this.CLIENT_ID}:${this.CLIENT_SECRET}`
            )}`,
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000;

      if (!this.accessToken) {
        throw new Error("Failed to obtain access token");
      }

      return this.accessToken;
    } catch (error) {
      console.error("Error getting Spotify access token:", error);
      throw error;
    }
  }

  // Search for meditation/wellness tracks
  static async searchWellnessTracks(
    query: string,
    category: string
  ): Promise<MusicTrack[]> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get("https://api.spotify.com/v1/search", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: query,
          type: "track",
          limit: 20,
          market: "US",
        },
      });

      // Add null checks and filtering
      if (!response.data?.tracks?.items) {
        console.warn("No tracks found in Spotify response");
        return [];
      }

      return response.data.tracks.items
        .filter((track: any) => {
          // Filter out null/invalid tracks
          return (
            track &&
            track.id &&
            track.name &&
            track.artists &&
            Array.isArray(track.artists) &&
            track.artists.length > 0 &&
            track.album &&
            track.external_urls?.spotify
          );
        })
        .map((track: SpotifyTrack) => ({
          id: track.id,
          title: track.name || "Unknown Title",
          artist:
            track.artists
              ?.map((artist) => artist?.name || "Unknown Artist")
              .join(", ") || "Unknown Artist",
          album: track.album?.name || "Unknown Album",
          duration: Math.floor(track.duration_ms / 1000) || 180, // Default 3 minutes
          coverImage:
            track.album?.images?.[0]?.url ||
            "https://via.placeholder.com/300x300",
          previewUrl: track.preview_url || null,
          spotifyUrl:
            track.external_urls?.spotify ||
            `https://open.spotify.com/track/${track.id}`,
          category: this.categorizeTrack(
            (track.name || "") + " " + (track.artists?.[0]?.name || "")
          ),
          popularity: track.popularity || 50,
          type: "track" as const,
        }));
    } catch (error) {
      console.error("Error searching Spotify tracks:", error);
      return [];
    }
  }

  // Search for wellness playlists - FIXED VERSION
  static async searchWellnessPlaylists(query: string): Promise<MusicTrack[]> {
    try {
      const token = await this.getAccessToken();
      const response = await axios.get("https://api.spotify.com/v1/search", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: query,
          type: "playlist",
          limit: 10,
          market: "US",
        },
      });

      // Add comprehensive null checks
      if (!response.data?.playlists?.items) {
        console.warn("No playlists found in Spotify response");
        return [];
      }

      console.log(
        "Raw playlist response:",
        JSON.stringify(response.data.playlists.items.slice(0, 2), null, 2)
      );

      return response.data.playlists.items
        .filter((playlist: any) => {
          // Filter out null/invalid playlists
          const isValid =
            playlist &&
            playlist.id &&
            playlist.name &&
            playlist.external_urls?.spotify &&
            playlist.owner?.display_name &&
            playlist.tracks?.total !== undefined;

          if (!isValid) {
            console.log("Filtering out invalid playlist:", {
              hasPlaylist: !!playlist,
              hasId: !!playlist?.id,
              hasName: !!playlist?.name,
              hasSpotifyUrl: !!playlist?.external_urls?.spotify,
              hasOwner: !!playlist?.owner?.display_name,
              hasTracks: playlist?.tracks?.total !== undefined,
            });
          }

          return isValid;
        })
        .map((playlist: SpotifyPlaylist) => {
          try {
            return {
              id: playlist.id,
              title: playlist.name || "Unknown Playlist",
              artist: playlist.owner?.display_name || "Unknown Creator",
              album: `${playlist.tracks?.total || 0} tracks`,
              duration: (playlist.tracks?.total || 0) * 180, // Estimate 3 minutes per track
              coverImage:
                playlist.images?.[0]?.url ||
                "https://via.placeholder.com/300x300",
              spotifyUrl:
                playlist.external_urls?.spotify ||
                `https://open.spotify.com/playlist/${playlist.id}`,
              category: this.categorizeTrack(
                (playlist.name || "") + " " + (playlist.description || "")
              ),
              popularity: 75, // Default popularity for playlists
              type: "playlist" as const,
              description: playlist.description || undefined,
            };
          } catch (mapError) {
            console.error("Error mapping playlist:", mapError, playlist);
            return null;
          }
        })
        .filter(
          (track: MusicTrack | null): track is MusicTrack => track !== null
        ); // Remove any null results from mapping errors
    } catch (error) {
      console.error("Error searching Spotify playlists:", error);
      return [];
    }
  }

  // Get curated wellness music collections - IMPROVED ERROR HANDLING
  static async fetchWellnessMusic(
    categories: string[] = ["meditation", "sleep", "focus", "nature", "anxiety"]
  ): Promise<MusicTrack[]> {
    const allMusic: MusicTrack[] = [];

    // Add curated local tracks first
    try {
      const curatedMusic = this.generateCuratedMusic();
      allMusic.push(...curatedMusic);
      console.log(`Added ${curatedMusic.length} curated tracks`);
    } catch (error) {
      console.error("Error adding curated music:", error);
    }

    // Search for each category with improved error handling
    for (const category of categories) {
      try {
        const searchQueries = this.getSearchQueries(category);
        console.log(`Searching ${category} with queries:`, searchQueries);

        for (const query of searchQueries.slice(0, 2)) {
          // Limit queries to reduce API calls
          try {
            // Search tracks
            const tracks = await this.searchWellnessTracks(query, category);
            if (tracks.length > 0) {
              allMusic.push(...tracks.slice(0, 2)); // Limit tracks per query
              console.log(
                `Added ${
                  tracks.slice(0, 2).length
                } tracks for ${category} - ${query}`
              );
            }

            // Search playlists with more conservative approach
            const playlists = await this.searchWellnessPlaylists(query);
            if (playlists.length > 0) {
              allMusic.push(...playlists.slice(0, 1)); // Limit playlists per query
              console.log(
                `Added ${
                  playlists.slice(0, 1).length
                } playlists for ${category} - ${query}`
              );
            }

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
          } catch (queryError) {
            console.error(
              `Error with query "${query}" for category ${category}:`,
              queryError
            );
            continue; // Continue with next query
          }
        }
      } catch (categoryError) {
        console.error(`Error fetching ${category} music:`, categoryError);
        continue; // Continue with next category
      }
    }

    console.log(`Total music items before deduplication: ${allMusic.length}`);

    // Remove duplicates and shuffle
    try {
      const uniqueMusic = this.removeDuplicates(allMusic);
      const shuffledMusic = this.shuffleArray(uniqueMusic);
      console.log(
        `Final music count after deduplication: ${shuffledMusic.length}`
      );
      return shuffledMusic;
    } catch (error) {
      console.error("Error processing final music list:", error);
      return allMusic; // Return unprocessed list as fallback
    }
  }

  // Get search queries for different categories
  private static getSearchQueries(category: string): string[] {
    const queries = {
      meditation: ["meditation music", "mindfulness sounds", "zen meditation"],
      sleep: ["sleep music", "bedtime sounds", "deep sleep"],
      focus: ["focus music", "concentration sounds", "study music"],
      nature: ["nature sounds", "rain sounds", "ocean waves"],
      anxiety: ["anxiety relief music", "calming sounds", "peaceful music"],
      stress: [
        "stress relief music",
        "relaxation sounds",
        "calming meditation",
      ],
    };

    return (
      queries[category as keyof typeof queries] || [
        `${category} wellness music`,
      ]
    );
  }

  // Categorize tracks based on content
  private static categorizeTrack(
    content: string
  ): "meditation" | "sleep" | "focus" | "nature" | "anxiety" | "stress" {
    const lowerContent = (content || "").toLowerCase();

    if (
      lowerContent.includes("sleep") ||
      lowerContent.includes("bedtime") ||
      lowerContent.includes("night")
    ) {
      return "sleep";
    } else if (
      lowerContent.includes("focus") ||
      lowerContent.includes("concentration") ||
      lowerContent.includes("study")
    ) {
      return "focus";
    } else if (
      lowerContent.includes("nature") ||
      lowerContent.includes("rain") ||
      lowerContent.includes("ocean") ||
      lowerContent.includes("forest")
    ) {
      return "nature";
    } else if (
      lowerContent.includes("anxiety") ||
      lowerContent.includes("calm") ||
      lowerContent.includes("peace")
    ) {
      return "anxiety";
    } else if (
      lowerContent.includes("stress") ||
      lowerContent.includes("relax") ||
      lowerContent.includes("sooth")
    ) {
      return "stress";
    }

    return "meditation"; // Default
  }

  // Generate curated music collection
  static generateCuratedMusic(): MusicTrack[] {
    return [
      {
        id: "curated_meditation_1",
        title: "Deep Meditation Journey",
        artist: "Mindful Sounds",
        album: "Inner Peace Collection",
        duration: 600, // 10 minutes
        coverImage:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
        spotifyUrl: "https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC",
        category: "meditation",
        popularity: 85,
        type: "track",
        description: "A deep meditation track for inner peace and mindfulness",
      },
      {
        id: "curated_sleep_1",
        title: "Peaceful Sleep Sounds",
        artist: "Sleep Harmony",
        album: "Restful Nights",
        duration: 3600, // 1 hour
        coverImage:
          "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55",
        spotifyUrl: "https://open.spotify.com/track/2ZWlPOoWh0626oTaHrnl2a",
        category: "sleep",
        popularity: 90,
        type: "track",
        description: "Soothing sounds for a peaceful night's sleep",
      },
      {
        id: "curated_focus_1",
        title: "Concentration Flow",
        artist: "Focus Masters",
        album: "Productivity Zone",
        duration: 1800, // 30 minutes
        coverImage:
          "https://images.unsplash.com/photo-1493836512294-502baa1986e2",
        spotifyUrl: "https://open.spotify.com/track/4VqPOruhp5EdPBeR92t6lQ",
        category: "focus",
        popularity: 80,
        type: "track",
        description:
          "Enhance your focus and concentration with this ambient track",
      },
      {
        id: "curated_nature_1",
        title: "Forest Rain Ambience",
        artist: "Nature Sounds",
        album: "Earth's Symphony",
        duration: 2700, // 45 minutes
        coverImage:
          "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
        spotifyUrl: "https://open.spotify.com/track/2takcwOaAZWiXQijPHIx7B",
        category: "nature",
        popularity: 88,
        type: "track",
        description: "Natural forest sounds with gentle rain for relaxation",
      },
      {
        id: "curated_anxiety_1",
        title: "Anxiety Relief Meditation",
        artist: "Calm Collective",
        album: "Healing Frequencies",
        duration: 900, // 15 minutes
        coverImage:
          "https://images.unsplash.com/photo-1499209974431-9dddcece7f88",
        spotifyUrl: "https://open.spotify.com/track/1zHlj4dQ8ZAtrayhuDDmkY",
        category: "anxiety",
        popularity: 87,
        type: "track",
        description:
          "Specially designed frequencies to reduce anxiety and promote calm",
      },
    ];
  }

  // Utility functions
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private static removeDuplicates(tracks: MusicTrack[]): MusicTrack[] {
    const seen = new Set();
    return tracks.filter((track) => {
      if (!track || !track.title || !track.artist) {
        return false; // Filter out invalid tracks
      }

      const key = `${track.title}-${track.artist}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

export default SpotifyAPI;
export type { MusicTrack };
