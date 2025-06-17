import { expect, test } from 'vitest';
import { handleSoundCloudRequest } from '../src/soundcloud';

test('soundcloud API handles missing videoid', async () => {
  const request = new Request('http://example.com/?route=soundcloud');
  const env = {};
  
  const response = await handleSoundCloudRequest(request, env);
  const data = await response.json();
  
  expect(data.status).toBe('failed');
  expect(data.message).toContain('plese set indentify music id');
  expect(data.product_type).toBe('soundcloud api');
});

test('soundcloud API handles numeric videoid', async () => {
  const request = new Request('http://example.com/?route=soundcloud&videoid=557856309');
  const env = {};
  
  const response = await handleSoundCloudRequest(request, env);
  
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/json');
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
});

test('soundcloud API handles url-style videoid', async () => {
  const request = new Request('http://example.com/?route=soundcloud&videoid=user/track-name');
  const env = {};
  
  const response = await handleSoundCloudRequest(request, env);
  
  expect(response.status).toBe(200);
});

test('soundcloud API handles image_base64 parameter', async () => {
  const request = new Request('http://example.com/?route=soundcloud&videoid=557856309&image_base64=1');
  const env = {};
  
  const response = await handleSoundCloudRequest(request, env);
  
  expect(response.status).toBe(200);
});

test('soundcloud API handles invalid videoid', async () => {
  const request = new Request('http://example.com/?route=soundcloud&videoid=invalid_id');
  const env = {};
  
  const response = await handleSoundCloudRequest(request, env);
  const data = await response.json();
  
  expect(response.status).toBe(200);
  // The response may contain various fields depending on the SoundCloud API response
  expect(data).toBeDefined();
});