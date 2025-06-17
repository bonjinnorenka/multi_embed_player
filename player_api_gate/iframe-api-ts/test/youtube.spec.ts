import { expect, test } from 'vitest';
import { handleYouTubeRequest } from '../src/youtube';

test('youtube API handles missing videoid', async () => {
  const request = new Request('http://example.com/?route=youtube');
  const env = {};
  
  const response = await handleYouTubeRequest(request, env);
  const data = await response.json();
  
  expect(data.status).toBe('failed');
  expect(data.message).toContain('plese set indentify music id');
  expect(data.product_type).toBe('youtube api');
});

test('youtube API handles valid request', async () => {
  const request = new Request('http://example.com/?route=youtube&videoid=dQw4w9WgXcQ');
  const env = {};
  
  const response = await handleYouTubeRequest(request, env);
  
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/json');
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
});

test('youtube API handles image_base64 parameter', async () => {
  const request = new Request('http://example.com/?route=youtube&videoid=dQw4w9WgXcQ&image_base64=1');
  const env = {};
  
  const response = await handleYouTubeRequest(request, env);
  
  expect(response.status).toBe(200);
});

test('youtube API handles invalid video id', async () => {
  const request = new Request('http://example.com/?route=youtube&videoid=invalid_id');
  const env = {};
  
  const response = await handleYouTubeRequest(request, env);
  const data = await response.json();
  
  expect(response.status).toBe(200);
  expect(data.status).toBe('failed notfound?');
});