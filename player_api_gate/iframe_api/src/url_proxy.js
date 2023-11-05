export default {
	async fetch(request, env, ctx) {
		let return_data = {};
		//get query string
		const { searchParams } = new URL(request.url);
  		let proxy_url = searchParams.get('url');
		if(proxy_url==null){
			return_data["status"] = "failed";
			return_data["message"] = "plese set url in query string example ?url=https://i.ytimg.com/vi/giXeMGjDkgk/hqdefault.jpg";
			return_data["product_type"] = "bilibili api";
			return new Response(JSON.stringify(return_data),
				{headers: {
				'content-type': 'application/json',
				'Access-Control-Allow-Origin':'*',
				'cache-control': 'max-age=2592000'
			}});
		}
        const fetch_data = await fetch(proxy_url);
        const image_data = await fetch_data.arrayBuffer();
		return new Response(image_data,
			{headers: {
				'content-type': fetch_data.headers.get("content-type"),
				'Access-Control-Allow-Origin':'*',
				'cache-control': 'max-age=2592000'
			},
	  	});
	},
};
