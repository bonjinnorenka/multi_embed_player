import { expect, test } from 'vitest';
import { SELF } from 'cloudflare:test';
import { handleBilibiliRequest } from '../src/bilibili';

test('bilibili API handles missing videoid', async () => {
  const request = new Request('http://example.com/?route=bilibili');
  const env = {};
  
  const response = await handleBilibiliRequest(request, env);
  const data = await response.json();
  
  expect(data.status).toBe('failed');
  expect(data.message).toContain('plese set bvid');
  expect(data.product_type).toBe('bilibili api');
});

test('bilibili API handles valid request', async () => {
  const request = new Request('http://example.com/?route=bilibili&videoid=BV1Yq4y1Z785');
  const env = {};
  
  const response = await handleBilibiliRequest(request, env);
  
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('application/json');
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
});

test('bilibili API handles proxy mode', async () => {
  const request = new Request('http://example.com/?route=bilibili&videoid=BV1Yq4y1Z785');
  const env = {
    PROXY_VIA_URL: 'https://proxy.example.com',
    PROXY_AUTH: 'test-auth'
  };
  
  const response = await handleBilibiliRequest(request, env);
  
  expect(response.status).toBe(200);
});

test('bilibili API handles image_base64 parameter', async () => {
  const request = new Request('http://example.com/?route=bilibili&videoid=BV1Yq4y1Z785&image_base64=1');
  const env = {};
  
  const response = await handleBilibiliRequest(request, env);
  
  expect(response.status).toBe(200);
});