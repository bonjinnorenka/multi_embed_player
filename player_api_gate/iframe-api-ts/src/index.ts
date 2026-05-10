import type { Env } from './types';
import { parseWhiteList, isWhiteListAllowed } from './utils';
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

		switch (route) {
			case 'url_proxy':
				return handleUrlProxyRequest(request, env);
			case 'niconico':
				return handleNiconicoRequest(request, env);
			case 'bilibili':
				return handleBilibiliRequest(request, env);
			case 'soundcloud':
				return handleSoundCloudRequest(request, env);
			case 'youtube':
				return handleYouTubeRequest(request, env);
			case 'applemusic':
				return handleAppleMusicRequest(request, env);
			case 'applemusic-token':
				return handleAppleMusicTokenRequest(request, env);
			default:
				return new Response("route not found", { status: 404 });
		}
	},
} satisfies ExportedHandler<Env>;
