import type { Env, BilibiliResponse } from './types';
import { createErrorResponse, createSuccessResponse, getImageAsBase64 } from './utils';

export const handleBilibiliRequest = async (request: Request, env: Env): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const videoid = searchParams.get('videoid');
  
  if (!videoid) {
    return createErrorResponse(
      'plese set bvid in query string example ?videoid=BV1Yq4y1Z785',
      'bilibili api'
    );
  }

  const url = `https://api.bilibili.com/x/web-interface/view?bvid=${videoid}`;
  let response: Response;
  let resdata: BilibiliResponse;

  try {
    if (env.PROXY_VIA_URL) {
      response = await fetch(env.PROXY_VIA_URL, {
        method: "POST",
        body: JSON.stringify({ urls: [url] }),
        headers: {
          "content-type": "application/json",
          "user-agent": env.PROXY_AUTH || ""
        }
      });
      const resTmpData = await response.json();
      resdata = JSON.parse(resTmpData[url]);
    } else {
      response = await fetch(url);
      resdata = await response.json();
    }

    if (resdata.code === 0 && searchParams.get("image_base64") === '1') {
      if (resdata.data?.pic) {
        resdata.image_base64 = await getImageAsBase64(resdata.data.pic);
      }
    }

    return createSuccessResponse(resdata);
  } catch (error) {
    return createErrorResponse(
      'Failed to fetch bilibili data',
      'bilibili api'
    );
  }
};