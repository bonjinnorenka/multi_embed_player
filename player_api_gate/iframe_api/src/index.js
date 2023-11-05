/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import niconico from "./niconico_api";
import bilibili from "./bilibili_api.js";
import url_proxy from "./url_proxy.js";
import soundcloud from "./soundcloud_api.js";
import youtube from "./youtube_api.js";

const white_list = [];//please rewrite to your origin to prevent abuse from others.if empty, allow access from all origin

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		// You can get pretty far with simple logic like if/switch-statements
		if(white_list.length!==0&&(!(request.headers.get("origin"))||!white_list.includes(request.headers.get("origin")))){
			return new Response("access from this origin is not allowed");
		}

		switch (url.searchParams.get("route")) {
		case 'url_proxy':
			return url_proxy.fetch(request, env, ctx);
		case 'niconico':
			return niconico.fetch(request, env, ctx);
		case 'bilibili':
			return bilibili.fetch(request, env, ctx);
		case 'soundcloud':
			return soundcloud.fetch(request, env, ctx);
		case 'youtube':
			return youtube.fetch(request, env, ctx);
		default :
			return new Response("route not found");
		}
	},
};
