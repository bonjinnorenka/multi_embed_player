import type { Env } from './types';
import { parseWhiteList, isWhiteListAllowed, applyCredentialCorsHeaders } from './utils';
import { handleBilibiliRequest } from './bilibili';
import { handleYouTubeRequest } from './youtube';
import { handleNiconicoRequest } from './niconico';
import { handleSoundCloudRequest } from './soundcloud';
import { handleUrlProxyRequest } from './url-proxy';
import { handleAppleMusicRequest, handleAppleMusicTokenRequest } from './applemusic';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);
		const route = url.searchParams.get("route");

		const whiteList = parseWhiteList(env.WhiteList);
		if (route !== 'applemusic-token' && !isWhiteListAllowed(request, whiteList)) {
			return new Response("access from this origin is not allowed", { status: 403 });
		}

		let response: Response;
		switch (route) {
			case 'url_proxy':
				response = await handleUrlProxyRequest(request, env);
				break;
			case 'niconico':
				response = await handleNiconicoRequest(request, env);
				break;
			case 'bilibili':
				response = await handleBilibiliRequest(request, env);
				break;
			case 'soundcloud':
				response = await handleSoundCloudRequest(request, env);
				break;
			case 'youtube':
				response = await handleYouTubeRequest(request, env);
				break;
			case 'applemusic':
				response = await handleAppleMusicRequest(request, env);
				break;
			case 'applemusic-token':
				return handleAppleMusicTokenRequest(request, env);
			default:
				return new Response("route not found", { status: 404 });
		}
		return applyCredentialCorsHeaders(response, request, whiteList);
	},
} satisfies ExportedHandler<Env>;
