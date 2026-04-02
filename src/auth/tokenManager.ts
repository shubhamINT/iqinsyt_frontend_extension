const TOKEN_KEY = 'iqinsyt_auth';
const BASE_URL = import.meta.env.VITE_BACKEND_URL as string;

interface StoredTokens {
  access: string;
  refresh: string;
  savedAt: number;
}

export async function setTokens(access: string, refresh: string): Promise<void> {
  await chrome.storage.local.set({
    [TOKEN_KEY]: { access, refresh, savedAt: Date.now() } satisfies StoredTokens,
  });
}

export async function clearTokens(): Promise<void> {
  await chrome.storage.local.remove(TOKEN_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  const data = await chrome.storage.local.get(TOKEN_KEY);
  const tokens = data[TOKEN_KEY] as StoredTokens | undefined;
  if (!tokens) return null;

  const payload = JSON.parse(atob(tokens.access.split('.')[1])) as { exp: number };
  const expiresInMs = payload.exp * 1000 - Date.now();

  if (expiresInMs < 60_000) {
    return refreshAccessToken(tokens.refresh);
  }

  return tokens.access;
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const response = await fetch(`${BASE_URL}/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    await clearTokens();
    return null;
  }

  const { accessToken, refreshToken: newRefresh } = await response.json() as {
    accessToken: string;
    refreshToken: string;
  };

  await setTokens(accessToken, newRefresh);
  return accessToken;
}
