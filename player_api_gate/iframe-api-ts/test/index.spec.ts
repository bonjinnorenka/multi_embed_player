import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Iframe API Router', () => {
	it('handles unknown route', async () => {
		const response = await SELF.fetch('http://example.com/?route=unknown');
		expect(response.status).toBe(404);
		expect(await response.text()).toBe('route not found');
	});

	it('handles whitelist restriction', async () => {
		const request = new IncomingRequest('http://example.com/?route=youtube&videoid=test', {
			headers: { 'origin': 'https://unauthorized.com' }
		});
		const ctx = createExecutionContext();
		const testEnv = { ...env, WhiteList: '["https://authorized.com"]' };
		const response = await worker.fetch(request, testEnv, ctx);
		await waitOnExecutionContext(ctx);
		
		expect(response.status).toBe(403);
		expect(await response.text()).toBe('access from this origin is not allowed');
	});

	it('allows request without whitelist', async () => {
		const response = await SELF.fetch('http://example.com/?route=youtube&videoid=dQw4w9WgXcQ');
		expect(response.status).toBe(200);
	});

	it('routes to bilibili', async () => {
		const response = await SELF.fetch('http://example.com/?route=bilibili&videoid=BV1Yq4y1Z785');
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toBe('application/json');
	});

	it('routes to youtube', async () => {
		const response = await SELF.fetch('http://example.com/?route=youtube&videoid=dQw4w9WgXcQ');
		expect(response.status).toBe(200);
	});

	it('routes to niconico', async () => {
		const response = await SELF.fetch('http://example.com/?route=niconico&videoid=sm9');
		expect(response.status).toBe(200);
	});

	it('routes to soundcloud', async () => {
		const response = await SELF.fetch('http://example.com/?route=soundcloud&videoid=557856309');
		expect(response.status).toBe(200);
	});

	it('routes to url_proxy', async () => {
		const response = await SELF.fetch('http://example.com/?route=url_proxy&url=https://httpbin.org/json');
		expect(response.status).toBe(200);
	});
});
