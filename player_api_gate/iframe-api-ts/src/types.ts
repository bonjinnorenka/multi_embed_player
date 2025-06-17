interface Env {
  WhiteList?: string;
  PROXY_VIA_URL?: string;
  PROXY_AUTH?: string;
  NON_PROFIT?: string;
}

interface BaseResponse {
  status: string;
  message?: string;
  product_type?: string;
}

interface BilibiliResponse extends BaseResponse {
  code?: number;
  data?: {
    bvid: string;
    aid: number;
    videos: number;
    tid: number;
    tname: string;
    copyright: number;
    pic: string;
    title: string;
    pubdate: number;
    ctime: number;
    desc: string;
    duration: number;
    owner: {
      mid: number;
      name: string;
      face: string;
    };
    stat: {
      aid: number;
      view: number;
      danmaku: number;
      reply: number;
      favorite: number;
      coin: number;
      share: number;
      now_rank: number;
      his_rank: number;
      like: number;
      dislike: number;
      evaluation: string;
      argue_msg: string;
    };
  };
  image_base64?: string;
}

interface YouTubeResponse extends BaseResponse {
  title?: string;
  author_name?: string;
  author_url?: string;
  type?: string;
  height?: number;
  width?: number;
  version?: string;
  provider_name?: string;
  provider_url?: string;
  thumbnail_height?: number;
  thumbnail_width?: number;
  thumbnail_url?: string;
  html?: string;
  image_base64?: string;
}

interface NiconicoResponse extends BaseResponse {
  videoid?: string;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  length?: string | number;
  view_count?: string | number;
  comment_count?: string;
  mylist_count?: string;
  publish_time?: string;
  embedable?: string;
  genre?: string;
  image_base64?: string;
}

interface SoundCloudResponse extends BaseResponse {
  version?: string;
  type?: string;
  provider_name?: string;
  provider_url?: string;
  height?: number;
  width?: number;
  title?: string;
  description?: string;
  thumbnail_url?: string;
  html?: string;
  author_name?: string;
  author_url?: string;
  image_base64?: string;
}

interface CommonHeaders {
  'content-type': string;
  'Access-Control-Allow-Origin': string;
  'cache-control': string;
}

export type { 
  Env,
  BaseResponse,
  BilibiliResponse,
  YouTubeResponse,
  NiconicoResponse,
  SoundCloudResponse,
  CommonHeaders
};