const KEYS = {
  accessToken:  'carbmaps_strava_access_token',
  refreshToken: 'carbmaps_strava_refresh_token',
  expiresAt:    'carbmaps_strava_expires_at',
  athleteName:  'carbmaps_strava_athlete_name',
  athleteId:    'carbmaps_strava_athlete_id',
};

export interface StravaTokens {
  access_token:  string;
  refresh_token: string;
  expires_at:    number;
  athlete?: { id: number; firstname: string };
}

export function saveStravaTokens(tokens: StravaTokens): void {
  localStorage.setItem(KEYS.accessToken,  tokens.access_token);
  localStorage.setItem(KEYS.refreshToken, tokens.refresh_token);
  localStorage.setItem(KEYS.expiresAt,    String(tokens.expires_at));
  if (tokens.athlete?.firstname) {
    localStorage.setItem(KEYS.athleteName, tokens.athlete.firstname);
  }
  if (tokens.athlete?.id) {
    localStorage.setItem(KEYS.athleteId, String(tokens.athlete.id));
  }
}

export function getStravaTokens() {
  const accessToken  = localStorage.getItem(KEYS.accessToken);
  const refreshToken = localStorage.getItem(KEYS.refreshToken);
  const expiresAt    = localStorage.getItem(KEYS.expiresAt);
  if (!accessToken || !refreshToken || !expiresAt) return null;
  return {
    accessToken,
    refreshToken,
    expiresAt:   parseInt(expiresAt, 10),
    athleteName: localStorage.getItem(KEYS.athleteName) ?? '',
    athleteId:   localStorage.getItem(KEYS.athleteId) ?? '',
  };
}

export function clearStravaTokens(): void {
  Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}

export function isStravaConnected(): boolean {
  return !!localStorage.getItem(KEYS.accessToken);
}

const API_BASE = import.meta.env.VITE_API_URL ?? '';

export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getStravaTokens();
  if (!tokens) return null;

  // Return early if token is still valid (5-min buffer)
  if (tokens.expiresAt > Math.floor(Date.now() / 1000) + 300) {
    return tokens.accessToken;
  }

  // Refresh
  try {
    const res = await fetch(`${API_BASE}/api/strava/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: tokens.refreshToken }),
    });
    if (!res.ok) { clearStravaTokens(); return null; }
    const data = await res.json();
    saveStravaTokens(data);
    return data.access_token;
  } catch {
    return null;
  }
}
