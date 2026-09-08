/** Standard auth API envelope: `{ success, code?, message?, data }` */
export type AuthApiEnvelope = {
  success?: boolean;
  code?: number;
  message?: string;
  data?: unknown;
};

export type ParsedAuthTokens = {
  accessToken: string;
  refreshToken: string | null;
};

export type ParsedAuthSession = ParsedAuthTokens & {
  username: string | null;
};

function readTokenField(obj: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function readNestedDataObject(body: Record<string, unknown>): Record<string, unknown> | null {
  const data = body.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return data as Record<string, unknown>;
  }
  return null;
}

/**
 * Login / refresh response:
 * `{ success, data: { accessToken, refreshToken, username? } }`
 *
 * Legacy refresh shape (still supported):
 * `{ success, data: "<accessJwt>" }`
 */
export function extractAccessTokenFromAuthResponse(raw: unknown): string | null {
  if (typeof raw === 'string' && raw.trim()) return raw.trim();
  if (!raw || typeof raw !== 'object') return null;

  const body = raw as AuthApiEnvelope & Record<string, unknown>;
  const nested = readNestedDataObject(body);

  if (nested) {
    const fromNested = readTokenField(nested, 'accessToken', 'access_token', 'token');
    if (fromNested) return fromNested;
  }

  if (typeof body.data === 'string' && body.data.trim()) {
    return body.data.trim();
  }

  return readTokenField(body, 'accessToken', 'access_token', 'token');
}

export function extractRefreshTokenFromAuthResponse(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;

  const body = raw as Record<string, unknown>;
  const nested = readNestedDataObject(body);

  if (nested) {
    const fromNested = readTokenField(nested, 'refreshToken', 'refresh_token');
    if (fromNested) return fromNested;
  }

  return readTokenField(body, 'refreshToken', 'refresh_token');
}

export function extractUsernameFromAuthResponse(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const nested = readNestedDataObject(raw as Record<string, unknown>);
  if (!nested) return null;
  return readTokenField(nested, 'username');
}

export function parseAuthSessionResponse(raw: unknown): ParsedAuthSession | null {
  const accessToken = extractAccessTokenFromAuthResponse(raw);
  if (!accessToken) return null;

  return {
    accessToken,
    refreshToken: extractRefreshTokenFromAuthResponse(raw),
    username: extractUsernameFromAuthResponse(raw),
  };
}

/** @deprecated Use parseAuthSessionResponse */
export function parseLoginAuthResponse(raw: unknown): ParsedAuthTokens | null {
  const session = parseAuthSessionResponse(raw);
  if (!session) return null;
  return { accessToken: session.accessToken, refreshToken: session.refreshToken };
}
