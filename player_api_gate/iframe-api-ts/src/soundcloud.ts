import type { Env, SoundCloudResponse } from './types';
import { createErrorResponse, createSuccessResponse, getImageAsBase64 } from './utils';

export const handleSoundCloudRequest = async (request: Request, env: Env): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const videoid = searchParams.get('videoid');
  
  if (!videoid) {
    return createErrorResponse(
      'plese set indentify music id in query string example ?videoid=557856309',
      'soundcloud api'
    );
  }

  const numericRegex = /^[0-9]+$/;
  let url: string;
  
  if (numericRegex.test(videoid)) {
    url = `https://soundcloud.com/oembed?url=https%3A//api.soundcloud.com/tracks/${videoid}&format=json`;
  } else {
    url = `https://soundcloud.com/oembed?url=https%3A//soundcloud.com/${videoid}&format=json`;
  }

  try {
    const response = await fetch(url);
    let resdata: SoundCloudResponse = await response.json();
    
    if (searchParams.get("image_base64") === '1' && resdata.thumbnail_url) {
      resdata.image_base64 = await getImageAsBase64(resdata.thumbnail_url);
    }

    return createSuccessResponse(resdata);
  } catch (error) {
    return createSuccessResponse({
      status: "error not found?"
    });
  }
};