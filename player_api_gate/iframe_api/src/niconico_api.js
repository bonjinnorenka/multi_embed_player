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
	xml_search(data, search_string, start = 0) {
		return data.substring(data.indexOf("<" + search_string + ">", start) + search_string.length + 2, data.indexOf("</" + search_string + ">", start))
	},
	random_string(length) {
		return [...Array(length)].map(i => (~~(Math.random() * 36)).toString(36)).join('');
	},
	async fetch(request, env, ctx) {
		let return_data = {};
		//get query string
		const { searchParams } = new URL(request.url);
		let videoid = searchParams.get('videoid');
		if (videoid == null) {
			return_data["status"] = "failed";
			return_data["message"] = "plese set videoid in query string";
			return_data["product_type"] = "niconico api";
			return new Response(JSON.stringify(return_data),
				{
					headers: {
						'content-type': 'application/json',
						'Access-Control-Allow-Origin': '*',
						'cache-control': 'max-age=2592000'
					}
				});
		}
		if (env.NON_PROFIT == "TRUE") {
			let url = "https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search?q&fields=contentId,title,thumbnailUrl,userId,channelId,startTime,lengthSeconds&filters[contentId][0]=" + videoid + "&_sort=-viewCounter&_limit=1&_context=" + this.random_string(10);
			const response = await fetch(url);
			let res = await response.json();
			if (res.meta.status == 200) {
				return_data["status"] = "success";
				return_data["videoid"] = videoid;
				return_data["title"] = res.data[0].title;
				return_data["thumbnail_url"] = res.data[0].thumbnailUrl;
				return_data["length"] = res.data[0].lengthSeconds;
				return_data["view_count"] = res.data[0].viewCounter;
				return_data["publish_time"] = res.data[0].startTime;
			}
			else {
				return_data["status"] = "invalid videoid";
				return_data["thumbnail_url"] = "";
			}
		}
		else {
			//get niconico api
			let url = "https://ext.nicovideo.jp/api/getthumbinfo/" + videoid;
			const response = await fetch(url);
			let res = await response.text();
			let image_url = this.xml_search(res, "thumbnail_url");
			let predict_long = 43 + 2 * (videoid.length - 2);
			if (image_url.length > predict_long) {
				image_url += ".L";
			}
			let xml_videoid = this.xml_search(res, "video_id");
			let title = this.xml_search(res, "title");
			let description = this.xml_search(res, "description");
			let length = this.xml_search(res, "length");
			let view_count = this.xml_search(res, "view_counter");
			let comment_count = this.xml_search(res, "comment_num");
			let mylist_count = this.xml_search(res, "mylist_counter");
			let publish_time = this.xml_search(res, "first_retrieve");
			let embedable = this.xml_search(res, "embeddable");
			let genre = this.xml_search(res, "genre");
			if (image_url == "<?xml version=") {
				return_data["status"] = "invalid videoid";
				return_data["thumbnail_url"] = "";
			}
			else {
				return_data["thumbnail_url"] = image_url;
				if (searchParams.get("image_base64") == 1) {
					const image_data = await (await fetch(image_url)).arrayBuffer();
					let binary = '';
					const bytes = new Uint8Array(image_data);
					const len = bytes.byteLength;
					for (let i = 0; i < len; i++) {
						binary += String.fromCharCode(bytes[i]);
					}
					return_data["image_base64"] = "data:image/jpeg;base64," + btoa(binary);
				}
				return_data["status"] = "success";
				return_data["videoid"] = xml_videoid;
				return_data["title"] = title;
				return_data["description"] = description;
				return_data["length"] = length;
				return_data["view_count"] = view_count;
				return_data["comment_count"] = comment_count;
				return_data["mylist_count"] = mylist_count;
				return_data["publish_time"] = publish_time;
				return_data["embedable"] = embedable;
				return_data["genre"] = genre;
			}
		}
		return new Response(JSON.stringify(return_data),
			{
				headers: {
					'content-type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'cache-control': 'max-age=2592000'
				},
			});
	},
};
