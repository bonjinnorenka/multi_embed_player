export default {
	async fetch(request, env, ctx) {
		let return_data = {};
		//get query string
		const { searchParams } = new URL(request.url);
  		let videoid = searchParams.get('videoid');
		if(videoid==null){
			return_data["status"] = "failed";
			return_data["message"] = "plese set indentify music id in query string example ?videoid=W6tZW00lix1";
			return_data["product_type"] = "youtube api";
			return new Response(JSON.stringify(return_data),
				{headers: {
				'content-type': 'application/json',
				'Access-Control-Allow-Origin':'*',
				'cache-control': 'max-age=2592000'
			}});
		}
		const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoid}&format=json`);
        let resdata;
        try{
            resdata = await response.json();
            if(searchParams.get("image_base64")==1){
                const image_data = await(await fetch(resdata["thumbnail_url"])).arrayBuffer();
                let binary = '';
                const bytes = new Uint8Array(image_data);
                const len = bytes.byteLength;
                for (let i = 0; i < len; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                resdata["image_base64"] = "data:image/jpeg;base64," + btoa(binary);
            }
        }
        catch{
            resdata = {title:"",status:"failed notfound?"};
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