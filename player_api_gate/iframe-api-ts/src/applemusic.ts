import type { AppleMusicResponse, Env } from './types';
import { createSuccessResponse, getImageAsBase64 } from './utils';

type TokenUse = 'browser' | 'metadata';

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
}

const APPLE_MUSIC_MAX_TTL_SECONDS = 15777000;
const APPLE_MUSIC_DEFAULT_TTL_SECONDS = 86400;
const TOKEN_REFRESH_MARGIN_SECONDS = 300;
const DEFAULT_STOREFRONT = 'jp';
const tokenCache = new Map<string, TokenCacheEntry>();

const base64UrlEncode = (data: string | ArrayBuffer): string => {
  let binary = '';
  if (typeof data === 'string') {
    binary = data;
  } else {
    const bytes = new Uint8Array(data);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
};

const jsonBase64UrlEncode = (data: Record<string, unknown>): string => {
  return base64UrlEncode(JSON.stringify(data));
};

const normalizePrivateKey = (privateKey: string): ArrayBuffer => {
  const pem = privateKey.replace(/\\n/g, '\n');
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const getTokenTtlSeconds = (env: Env): number => {
  const parsed = Number(env.APPLE_MUSIC_TOKEN_TTL_SECONDS);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return APPLE_MUSIC_DEFAULT_TTL_SECONDS;
  }
  return Math.min(Math.floor(parsed), APPLE_MUSIC_MAX_TTL_SECONDS);
};

const getDefaultStorefront = (env: Env): string => {
  return validateStorefront(env.APPLE_MUSIC_STOREFRONT || '') ? env.APPLE_MUSIC_STOREFRONT! : DEFAULT_STOREFRONT;
};

const validateStorefront = (storefront: string): boolean => {
  return /^[a-z]{2}$/.test(storefront);
};

const validateKind = (kind: string): boolean => {
  return kind === 'songs';
};

const parseAllowedOrigins = (value?: string): string[] => {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((origin): origin is string => typeof origin === 'string');
    }
  } catch {
    // Comma-separated env is the documented format.
  }
  return value.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const createCorsHeaders = (origin: string): HeadersInit => ({
  'content-type': 'application/json',
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Vary': 'Origin',
  'cache-control': 'no-store'
});

const createTokenErrorResponse = (message: string, status: number, origin?: string): Response => {
  const headers: HeadersInit = origin ? createCorsHeaders(origin) : {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'Vary': 'Origin'
  };
  return new Response(JSON.stringify({ status: 'failed', message, product_type: 'applemusic token api' }), {
    status,
    headers
  });
};

const normalizeAppleError = (status: number): AppleMusicResponse => {
  if (status === 404) {
    return { status: 'not_found', code: 404, message: 'Apple Music catalog song not found' };
  }
  if (status === 403) {
    return { status: 'forbidden', code: 403, message: 'Apple Music catalog request forbidden' };
  }
  if (status === 429) {
    return { status: 'rate_limited', code: 429, message: 'Apple Music API rate limited the request' };
  }
  return { status: 'failed', code: status, message: 'Apple Music API request failed' };
};

const createDeveloperToken = async (env: Env, use: TokenUse, origin?: string): Promise<TokenCacheEntry> => {
  if (!env.APPLE_MUSIC_TEAM_ID || !env.APPLE_MUSIC_KEY_ID || !env.APPLE_MUSIC_PRIVATE_KEY) {
    throw new Error('Apple Music credentials are not configured');
  }

  const ttl = getTokenTtlSeconds(env);
  const now = Math.floor(Date.now() / 1000);
  const cacheKey = use === 'browser'
    ? `browser:${origin || ''}:${env.APPLE_MUSIC_TEAM_ID}:${env.APPLE_MUSIC_KEY_ID}:${ttl}`
    : `metadata:${env.APPLE_MUSIC_TEAM_ID}:${env.APPLE_MUSIC_KEY_ID}:${ttl}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt - TOKEN_REFRESH_MARGIN_SECONDS > now) {
    return cached;
  }

  const header = jsonBase64UrlEncode({ alg: 'ES256', kid: env.APPLE_MUSIC_KEY_ID, typ: 'JWT' });
  const payloadData: Record<string, unknown> = {
    iss: env.APPLE_MUSIC_TEAM_ID,
    iat: now,
    exp: now + ttl
  };
  if (use === 'browser' && origin) {
    payloadData.origin = [origin];
  }
  const payload = jsonBase64UrlEncode(payloadData);
  const signingInput = `${header}.${payload}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    normalizePrivateKey(env.APPLE_MUSIC_PRIVATE_KEY),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    key,
    new TextEncoder().encode(signingInput)
  );
  const entry = {
    token: `${signingInput}.${base64UrlEncode(signature)}`,
    expiresAt: now + ttl
  };
  tokenCache.set(cacheKey, entry);
  return entry;
};

export const handleAppleMusicTokenRequest = async (request: Request, env: Env): Promise<Response> => {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = parseAllowedOrigins(env.APPLE_MUSIC_ALLOWED_ORIGINS);

  if (!origin || !allowedOrigins.includes(origin)) {
    return createTokenErrorResponse('Apple Music token origin is not allowed', 403);
  }

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: createCorsHeaders(origin) });
  }

  try {
    const token = await createDeveloperToken(env, 'browser', origin);
    return new Response(JSON.stringify({
      status: 'success',
      developerToken: token.token,
      expiresAt: token.expiresAt,
      storefront: getDefaultStorefront(env)
    }), {
      headers: createCorsHeaders(origin)
    });
  } catch (error) {
    return createTokenErrorResponse('Apple Music token could not be generated', 500, origin);
  }
};

export const handleAppleMusicRequest = async (request: Request, env: Env): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const videoid = searchParams.get('videoid');
  const kind = searchParams.get('kind') || 'songs';
  const storefront = searchParams.get('storefront') || getDefaultStorefront(env);

  if (!videoid) {
    return new Response(JSON.stringify({
      status: 'failed',
      message: 'plese set indentify music id in query string example ?videoid=2037093406',
      product_type: 'applemusic api'
    }), { status: 400, headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  if (!validateKind(kind)) {
    return new Response(JSON.stringify({
      status: 'failed',
      code: 400,
      message: 'Apple Music kind is not supported in v1',
      product_type: 'applemusic api'
    }), { status: 400, headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  if (!validateStorefront(storefront)) {
    return new Response(JSON.stringify({
      status: 'failed',
      code: 400,
      message: 'Apple Music storefront is invalid',
      product_type: 'applemusic api'
    }), { status: 400, headers: { 'content-type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    const token = await createDeveloperToken(env, 'metadata');
    const appleResponse = await fetch(
      `https://api.music.apple.com/v1/catalog/${storefront}/songs/${encodeURIComponent(videoid)}`,
      { headers: { Authorization: `Bearer ${token.token}` } }
    );

    if (!appleResponse.ok) {
      return createSuccessResponse(normalizeAppleError(appleResponse.status));
    }

    const data = await appleResponse.json() as any;
    const song = data?.data?.[0];
    if (!song?.attributes) {
      return createSuccessResponse(normalizeAppleError(404));
    }
    const attributes = song.attributes;
    const artworkUrl = typeof attributes?.artwork?.url === 'string'
      ? attributes.artwork.url.replace('{w}', '1200').replace('{h}', '1200')
      : '';
    const responseData: AppleMusicResponse = {
      status: 'success',
      id: song.id,
      kind,
      storefront,
      name: attributes.name,
      title: attributes.name,
      artistName: attributes.artistName,
      albumName: attributes.albumName,
      duration: typeof attributes.durationInMillis === 'number' ? attributes.durationInMillis / 1000 : undefined,
      thumbnail_url: artworkUrl,
      url: attributes.url
    };

    if (searchParams.get('image_base64') === '1' && artworkUrl) {
      responseData.image_base64 = await getImageAsBase64(artworkUrl);
    }

    return createSuccessResponse(responseData);
  } catch (error) {
    return createSuccessResponse({
      status: 'failed',
      code: 500,
      message: 'Failed to fetch Apple Music data'
    });
  }
};

export const __appleMusicTestExports = {
  parseAllowedOrigins,
  validateStorefront,
  validateKind,
  tokenCache
};
