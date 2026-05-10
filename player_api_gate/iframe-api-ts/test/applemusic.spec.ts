import { afterEach, expect, test, vi } from 'vitest';
import { handleAppleMusicRequest, handleAppleMusicTokenRequest } from '../src/applemusic';

const privateKey = `-----BEGIN PRIVATE KEY-----
MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgLUT+EI55ox14dF8Q
KM5ZhjmLu3n5D0+2BTmI9VbrAUahRANCAASUBzmV5dtTorHOGqqJAYVO753FGRzi
BnDPYV9y3m22+9SXlFJQnkr38yAgu3KIfpkxdIXiVvNazVZLqAv5Yr1l
-----END PRIVATE KEY-----`;

const env = {
  APPLE_MUSIC_TEAM_ID: 'TEAMID1234',
  APPLE_MUSIC_KEY_ID: 'KEYID1234',
  APPLE_MUSIC_PRIVATE_KEY: privateKey,
  APPLE_MUSIC_ALLOWED_ORIGINS: 'https://vsing.info,https://dev.vsing.info',
  APPLE_MUSIC_TOKEN_TTL_SECONDS: '86400',
  APPLE_MUSIC_STOREFRONT: 'jp'
};

afterEach(() => {
  vi.unstubAllGlobals();
});

test('applemusic token route rejects missing origin', async () => {
  const response = await handleAppleMusicTokenRequest(new Request('http://example.com/?route=applemusic-token'), env);
  const data = await response.json();

  expect(response.status).toBe(403);
  expect(data.status).toBe('failed');
});

test('applemusic token route rejects origins outside allowlist', async () => {
  const request = new Request('http://example.com/?route=applemusic-token', {
    headers: { Origin: 'https://evil.example' }
  });
  const response = await handleAppleMusicTokenRequest(request, env);

  expect(response.status).toBe(403);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe(null);
});

test('applemusic token route returns strict cors headers for allowed origin', async () => {
  const request = new Request('http://example.com/?route=applemusic-token', {
    headers: { Origin: 'https://vsing.info' }
  });
  const response = await handleAppleMusicTokenRequest(request, env);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://vsing.info');
  expect(response.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
  expect(response.headers.get('Vary')).toBe('Origin');
  expect(data.status).toBe('success');
  expect(data.developerToken.split('.')).toHaveLength(3);
  expect(data.storefront).toBe('jp');
});

test('applemusic token route reuses cached token before refresh margin', async () => {
  const request = new Request('http://example.com/?route=applemusic-token', {
    headers: { Origin: 'https://vsing.info' }
  });
  const first = await (await handleAppleMusicTokenRequest(request, env)).json() as any;
  const second = await (await handleAppleMusicTokenRequest(request, env)).json() as any;

  expect(second.developerToken).toBe(first.developerToken);
});

test('applemusic metadata rejects invalid kind', async () => {
  const response = await handleAppleMusicRequest(
    new Request('http://example.com/?route=applemusic&videoid=2037093406&kind=music-videos'),
    env
  );
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.code).toBe(400);
});

test('applemusic metadata rejects invalid storefront', async () => {
  const response = await handleAppleMusicRequest(
    new Request('http://example.com/?route=applemusic&videoid=2037093406&storefront=../us'),
    env
  );
  const data = await response.json();

  expect(response.status).toBe(400);
  expect(data.code).toBe(400);
});

test('applemusic metadata normalizes Apple API 404', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ errors: [] }), { status: 404 })));
  const response = await handleAppleMusicRequest(
    new Request('http://example.com/?route=applemusic&videoid=missing&storefront=jp'),
    env
  );
  const data = await response.json();

  expect(data.status).toBe('not_found');
  expect(data.code).toBe(404);
});

test('applemusic metadata normalizes Apple API 429', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ errors: [] }), { status: 429 })));
  const response = await handleAppleMusicRequest(
    new Request('http://example.com/?route=applemusic&videoid=rate-limited&storefront=jp'),
    env
  );
  const data = await response.json();

  expect(data.status).toBe('rate_limited');
  expect(data.code).toBe(429);
});

test('applemusic metadata maps song artwork url', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    data: [{
      id: '2037093406',
      attributes: {
        name: 'Test Song',
        artistName: 'Test Artist',
        albumName: 'Test Album',
        durationInMillis: 180000,
        artwork: { url: 'https://example.com/{w}x{h}.jpg' },
        url: 'https://music.apple.com/jp/song/test/2037093406'
      }
    }]
  }), { status: 200 })));
  const response = await handleAppleMusicRequest(
    new Request('http://example.com/?route=applemusic&videoid=2037093406&storefront=jp'),
    env
  );
  const data = await response.json();

  expect(data.status).toBe('success');
  expect(data.title).toBe('Test Song');
  expect(data.artistName).toBe('Test Artist');
  expect(data.duration).toBe(180);
  expect(data.thumbnail_url).toBe('https://example.com/1200x1200.jpg');
});
