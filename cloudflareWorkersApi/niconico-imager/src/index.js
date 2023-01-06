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
	xml_search(data,search_string,start=0){
		return data.substring(data.indexOf("<"+search_string+">",start)+search_string.length+2,data.indexOf("</"+search_string+">",start))
	},
	async fetch(request, env, ctx) {
		let return_data = {};
		//get query string
		const { searchParams } = new URL(request.url);
  		let videoid = searchParams.get('videoid');
		if(videoid==null){
			return_data["status"] = "failed";
			return_data["message"] = "plese set videoid in query string";
			return_data["product_type"] = "niconico api";
			return new Response(JSON.stringify(return_data),
				{headers: {
				'content-type': 'application/json',
				'Access-Control-Allow-Origin':'*',
				'cache-control': 'max-age=2592000'
			}});
		}
		//get niconico api
		let url = "https://ext.nicovideo.jp/api/getthumbinfo/" + videoid;
		const response = await fetch(url);
		let res = await response.text();
		let image_url = this.xml_search(res,"thumbnail_url");
		let predict_long = 43+2*(videoid.length-2);
		if(image_url.length>predict_long){
			image_url += ".L";
		}
		let xml_videoid = this.xml_search(res,"video_id");
		let title = this.xml_search(res,"title");
		let description = this.xml_search(res,"description");
		let length = this.xml_search(res,"length");
		let view_count = this.xml_search(res,"view_counter");
		let comment_count = this.xml_search(res,"comment_num");
		let mylist_count = this.xml_search(res,"mylist_counter");
		let publish_time = this.xml_search(res,"first_retrieve");
		let embedable = this.xml_search(res,"embeddable");
		let genre = this.xml_search(res,"genre");
		if(image_url=="<?xml version="){
			return_data["status"] = "invalid videoid";
			return_data["image"] = "";
		}
		else{
			return_data["image"] = image_url;
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
		return new Response(JSON.stringify(return_data),
			{headers: {
				'content-type': 'application/json',
				'Access-Control-Allow-Origin':'*',
				'cache-control': 'max-age=2592000'
			},
		});
	},
};
