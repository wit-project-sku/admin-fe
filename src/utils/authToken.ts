type JwtPayload = {
  exp?: number;
  sub?: string;
  username?: string;
};

export function parseJwtPayload(token: string | null | undefined): JwtPayload | null {
  if (!token) return null;
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;
    return JSON.parse(atob(segment)) as JwtPayload;
  } catch {
    return null;
  }
}

/** Returns true when token is missing, malformed, or past expiry (with optional skew). */
export function isAccessTokenExpired(token: string | null | undefined, skewSeconds = 30): boolean {
  if (!token) return true;
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return false;
  const expiresAtMs = payload.exp * 1000;
  return Date.now() >= expiresAtMs - skewSeconds * 1000;
}

export function usernameFromAccessToken(token: string | null | undefined): string | null {
  const payload = parseJwtPayload(token);
  return payload?.sub ?? payload?.username ?? null;
}
