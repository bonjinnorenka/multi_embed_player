import type { Env, NiconicoResponse } from './types';
import { createErrorResponse, createSuccessResponse, getImageAsBase64, randomString, xmlSearch } from './utils';

export const handleNiconicoRequest = async (request: Request, env: Env): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const videoid = searchParams.get('videoid');
  
  if (!videoid) {
    return createErrorResponse(
      'plese set videoid in query string',
      'niconico api'
    );
  }

  let returnData: NiconicoResponse = {};

  try {
    if (env.NON_PROFIT === "TRUE") {
      const url = `https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search?q&fields=contentId,title,thumbnailUrl,userId,channelId,startTime,lengthSeconds&filters[contentId][0]=${videoid}&_sort=-viewCounter&_limit=1&_context=${randomString(10)}`;
      
      const response = await fetch(url);
      const res = await response.json();
      
      if (res.meta.status === 200) {
        returnData.status = "success";
        returnData.videoid = videoid;
        returnData.title = res.data[0].title;
        returnData.thumbnail_url = res.data[0].thumbnailUrl;
        returnData.length = res.data[0].lengthSeconds;
        returnData.view_count = res.data[0].viewCounter;
        returnData.publish_time = res.data[0].startTime;
      } else {
        returnData.status = "invalid videoid";
        returnData.thumbnail_url = "";
      }
    } else {
      const url = `https://ext.nicovideo.jp/api/getthumbinfo/${videoid}`;
      const response = await fetch(url,{
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      const res = await response.text();
      
      const imageUrl = xmlSearch(res, "thumbnail_url");
      const predictLong = 43 + 2 * (videoid.length - 2);
      let finalImageUrl = imageUrl;
      
      if (imageUrl.length > predictLong) {
        finalImageUrl += ".L";
      }
      
      const xmlVideoid = xmlSearch(res, "video_id");
      const title = xmlSearch(res, "title");
      const description = xmlSearch(res, "description");
      const length = xmlSearch(res, "length");
      const viewCount = xmlSearch(res, "view_counter");
      const commentCount = xmlSearch(res, "comment_num");
      const mylistCount = xmlSearch(res, "mylist_counter");
      const publishTime = xmlSearch(res, "first_retrieve");
      const embedable = xmlSearch(res, "embeddable");
      const genre = xmlSearch(res, "genre");
      
      if (imageUrl === "<?xml version=") {
        returnData.status = "invalid videoid";
        returnData.thumbnail_url = "";
      } else {
        returnData.thumbnail_url = finalImageUrl;
        
        if (searchParams.get("image_base64") === '1') {
          returnData.image_base64 = await getImageAsBase64(finalImageUrl);
        }
        
        returnData.status = "success";
        returnData.videoid = xmlVideoid;
        returnData.title = title;
        returnData.description = description;
        returnData.length = length;
        returnData.view_count = viewCount;
        returnData.comment_count = commentCount;
        returnData.mylist_count = mylistCount;
        returnData.publish_time = publishTime;
        returnData.embedable = embedable;
        returnData.genre = genre;
      }
    }

    return createSuccessResponse(returnData);
  } catch (error) {
    return createErrorResponse(
      'Failed to fetch niconico data',
      'niconico api'
    );
  }
};