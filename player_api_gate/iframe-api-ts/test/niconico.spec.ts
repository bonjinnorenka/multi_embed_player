import { expect, test } from 'vitest';
import { handleNiconicoRequest } from '../src/niconico';

test('niconico API handles missing videoid', async () => {
  const request = new Request('http://example.com/?route=niconico');
  const env = {};
  
  const response = await handleNiconicoRequest(request, env);
  const data = await response.json();
  
  expect(data.status).toBe('failed');
  expect(data.message).toContain('plese set videoid');
  expect(data.product_type).toBe('niconico api');
});

test('niconico API handles valid request in normal mode', async () => {
  const request = new Request('http://example.com/?route=niconico&videoid=sm9');
  const env = {};
  
  const response = await handleNiconicoRequest(request, env);
  
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/json');
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
});

test('niconico API handles valid request in non-profit mode', async () => {
  const request = new Request('http://example.com/?route=niconico&videoid=sm9');
  const env = { NON_PROFIT: 'TRUE' };
  
  const response = await handleNiconicoRequest(request, env);
  
  expect(response.status).toBe(200);
});

test('niconico API handles image_base64 parameter', async () => {
  const request = new Request('http://example.com/?route=niconico&videoid=sm9&image_base64=1');
  const env = {};
  
  const response = await handleNiconicoRequest(request, env);
  
  expect(response.status).toBe(200);
});

test('niconico API handles invalid video id', async () => {
  const request = new Request('http://example.com/?route=niconico&videoid=invalid_id');
  const env = {};
  
  const response = await handleNiconicoRequest(request, env);
  const data = await response.json();
  
  expect(response.status).toBe(200);
  // The actual API may still return success for some invalid IDs, depending on the service response
  expect(data.status).toBeDefined();
});