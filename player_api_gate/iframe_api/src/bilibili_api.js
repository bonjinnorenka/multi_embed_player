/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.js` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.js --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx) {
		let return_data = {};
		//get query string
		const { searchParams } = new URL(request.url);
  		let videoid = searchParams.get('videoid');
		if(videoid==null){
			return_data["status"] = "failed";
			return_data["message"] = "plese set bvid in query string example ?videoid=BV1Yq4y1Z785";
			return_data["product_type"] = "bilibili api";
			return new Response(JSON.stringify(return_data),
				{headers: {
				'content-type': 'application/json',
				'Access-Control-Allow-Origin':'*',
				'cache-control': 'max-age=2592000'
			}});
		}
		//get bilibili api
		let url = "https://api.bilibili.com/x/web-interface/view?bvid=" + videoid;
		let response,resdata;
		console.log(env.PROXY_VIA_URL)
		if(env.PROXY_VIA_URL){
			response = await fetch(env.PROXY_VIA_URL,{"method":"POST","body":JSON.stringify({"urls":[url]}),"headers":{"content-type":"application/json","user-agent":env.PROXY_AUTH}});
			let res_tmp_data = await response.json();
			resdata = res_tmp_data[url];
			resdata = JSON.parse(resdata);
		}
		else{
			response = await fetch(url);
			resdata = await response.json();
		}
		if(resdata["code"]==0&&searchParams.get("image_base64")==1){
			const image_data = await(await fetch(resdata["data"]["pic"])).arrayBuffer();
			let binary = '';
			const bytes = new Uint8Array(image_data);
			const len = bytes.byteLength;
			for (let i = 0; i < len; i++) {
				binary += String.fromCharCode(bytes[i]);
			}
			resdata["image_base64"] = "data:image/jpeg;base64," + btoa(binary);
		}
		return new Response(JSON.stringify(resdata),
			{headers: {
				'content-type': 'application/json',
				'Access-Control-Allow-Origin':'*',
				'cache-control': 'max-age=2592000'
			},
	  	});
	},
};
