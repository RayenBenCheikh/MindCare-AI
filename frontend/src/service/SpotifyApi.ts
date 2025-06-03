import axios from "axios";

export interface MusicTrack {
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
      throw new Error("Failed to obtain Spotify access token");
    }

    return this.accessToken;
  }

  // Search for tracks by category
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
    const allTracks: MusicTrack[] = [];
    const token = await this.getAccessToken();

    for (const category of categories) {
      const response = await axios.get("https://api.spotify.com/v1/search", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          q: category,
          type: "track",
          limit: 10,
          market: "US",
        },
      });

      const tracks = response.data.tracks.items.map((track: any) => ({
        id: track.id,
        title: track.name,
        artist: track.artists.map((a: any) => a.name).join(", "),
        album: track.album.name,
        duration: Math.floor(track.duration_ms / 1000),
        coverImage: track.album.images[0]?.url || "",
        previewUrl: track.preview_url || undefined,
        spotifyUrl: track.external_urls.spotify,
        category: category as MusicTrack["category"],
        popularity: track.popularity,
        type: "track" as const,
        description: "",
      }));

      allTracks.push(...tracks);
    }

    // Remove duplicates by id
    const uniqueTracks = Array.from(
      new Map(allTracks.map((t) => [t.id, t])).values()
    );
    return uniqueTracks;
  }
}

export default SpotifyAPI;
