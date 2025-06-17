import { expect, test } from 'vitest';
import { handleUrlProxyRequest } from '../src/url-proxy';

test('url proxy handles missing url parameter', async () => {
  const request = new Request('http://example.com/?route=url_proxy');
  const env = {};
  
  const response = await handleUrlProxyRequest(request, env);
  const data = await response.json();
  
  expect(data.status).toBe('failed');
  expect(data.message).toContain('plese set url');
  expect(data.product_type).toBe('url proxy api');
});

test('url proxy handles valid url', async () => {
  const request = new Request('http://example.com/?route=url_proxy&url=https://httpbin.org/json');
  const env = {};
  
  const response = await handleUrlProxyRequest(request, env);
  
  expect(response.status).toBe(200);
  expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  expect(response.headers.get('cache-control')).toBe('max-age=2592000');
});

test('url proxy handles image url', async () => {
  const request = new Request('http://example.com/?route=url_proxy&url=https://httpbin.org/image/png');
  const env = {};
  
  const response = await handleUrlProxyRequest(request, env);
  
  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toContain('image');
});

test('url proxy handles invalid url', async () => {
  const request = new Request('http://example.com/?route=url_proxy&url=https://invalid-domain-that-does-not-exist.com');
  const env = {};
  
  const response = await handleUrlProxyRequest(request, env);
  const data = await response.json();
  
  expect(data.status).toBe('failed');
  expect(data.message).toContain('Failed to fetch');
});