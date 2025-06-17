import type { Env } from './types';
import { createErrorResponse, createProxyHeaders } from './utils';

export const handleUrlProxyRequest = async (request: Request, env: Env): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const proxyUrl = searchParams.get('url');
  
  if (!proxyUrl) {
    return createErrorResponse(
      'plese set url in query string example ?url=https://i.ytimg.com/vi/giXeMGjDkgk/hqdefault.jpg',
      'url proxy api'
    );
  }

  try {
    const fetchData = await fetch(proxyUrl);
    const imageData = await fetchData.arrayBuffer();
    const contentType = fetchData.headers.get("content-type") || "application/octet-stream";

    return new Response(imageData, {
      headers: createProxyHeaders(contentType)
    });
  } catch (error) {
    return createErrorResponse(
      'Failed to fetch proxied resource',
      'url proxy api'
    );
  }
};