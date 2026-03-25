let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export function hasSpotifyCredentials(): boolean {
  return !!(
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET &&
    process.env.SPOTIFY_REFRESH_TOKEN
  );
}

export async function getSpotifyAccessToken(): Promise<string | null> {
  if (!hasSpotifyCredentials()) return null;

  // Return cached token if still valid (60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.accessToken;
  }

  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID!;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
    const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN!;

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      console.error("Spotify token refresh error:", await response.text());
      return null;
    }

    const data = await response.json();
    cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return cachedToken.accessToken;
  } catch (error) {
    console.error("Spotify token refresh failed:", error);
    return null;
  }
}
