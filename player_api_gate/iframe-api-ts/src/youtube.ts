import type { Env, YouTubeResponse } from './types';
import { createErrorResponse, createSuccessResponse, getImageAsBase64 } from './utils';

export const handleYouTubeRequest = async (request: Request, env: Env): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const videoid = searchParams.get('videoid');
  
  if (!videoid) {
    return createErrorResponse(
      'plese set indentify music id in query string example ?videoid=W6tZW00lix1',
      'youtube api'
    );
  }

  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoid}&format=json`;
  
  try {
    const response = await fetch(url);
    let resdata: YouTubeResponse;
    
    try {
      resdata = await response.json();
      
      if (searchParams.get("image_base64") === '1' && resdata.thumbnail_url) {
        resdata.image_base64 = await getImageAsBase64(resdata.thumbnail_url);
      }
    } catch {
      resdata = { 
        title: "", 
        status: "failed notfound?" 
      };
    }

    return createSuccessResponse(resdata);
  } catch (error) {
    return createErrorResponse(
      'Failed to fetch youtube data',
      'youtube api'
    );
  }
};