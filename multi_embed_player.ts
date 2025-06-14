import {
  ApiCache,
  ApiPromise,
  GDPRAccepted,
  MEPStatusLoadApi,
  MEPLoadApiPromise,
  IframeApiClass,
  TearmsPolicyService,
  PlayerState,
  ErrorCode,
  EventHandler
} from './types';

// 型定義
interface FetchIframeApiOptions {
  service: string;
  videoid: string;
  useCors: boolean;
  imageProxy: boolean;
  GDPRAccessAccept: boolean;
  failedSendError?: boolean;
  failedSendErrorTarget?: HTMLElement | null;
}

interface VideoData {
  service: string;
  videoid: string;
  subService?: string;
  subVideoid?: string;
}

interface PlayItemData {
  service: string;
  videoid: string;
  startSeconds?: number;
  endSeconds?: number;
}

/**
 * Fetches the iframe API for a given service and video ID.
 */
const multi_embed_player_fetch_iframe_api = async (
  service: string,
  videoid: string,
  use_cors: boolean,
  image_proxy: boolean,
  GDPR_access_accept: boolean,
  failed_send_error: boolean = false,
  failed_send_error_target: HTMLElement | null = null
): Promise<void> => {
  const xml_first_search = (data: string, search_string: string, start: number = 0): string => {
    return data.substring(
      data.indexOf("<" + search_string + ">", start) + search_string.length + 2,
      data.indexOf("</" + search_string + ">", start)
    );
  };

  const possible_direct_access = GDPR_access_accept && multi_embed_player.possible_direct_access_services.includes(service);
  
  if (use_cors || possible_direct_access) {
    let url = "";
    if (possible_direct_access) {
      url = "";
    } else if (multi_embed_player.cors_proxy !== "") {
      url = multi_embed_player.cors_proxy;
    } else {
      url = `${multi_embed_player.iframe_api_endpoint}?route=url_proxy&url=`;
    }

    let first_access = false;
    if (!multi_embed_player.api_promise[service]) {
      multi_embed_player.api_promise[service] = {};
    }
    if (multi_embed_player.api_promise[service][videoid] === undefined) {
      multi_embed_player.api_promise[service][videoid] = { res: [], rej: [] };
      first_access = true;
    } else {
      await new Promise<void>((resolve, reject) => {
        const promise_data = multi_embed_player.api_promise[service][videoid];
        if (promise_data) {
          promise_data.res.push(resolve);
          promise_data.rej.push(reject);
        }
      });
    }

    try {
      if (first_access) {
        switch (service) {
          case 'soundcloud':
            const numericRegex = /^[0-9]+$/;
            let url_oembed: string;
            if (numericRegex.test(videoid)) {
              url_oembed = `https://soundcloud.com/oembed?url=https://api.soundcloud.com/tracks/${videoid}&format=json`;
            } else {
              url_oembed = `https://soundcloud.com/oembed?url=https://soundcloud.com/${videoid}&format=json`;
            }
            const oembed_response_fetch = await fetch(url + encodeURI(url_oembed));
            const oembed_response = await oembed_response_fetch.json();
            oembed_response["image_base64"] = url + oembed_response["thumbnail_url"];
            multi_embed_player.api_cache[service][videoid] = oembed_response;
            break;

          case 'niconico':
            const xml_response = await (await fetch(url + `https://ext.nicovideo.jp/api/getthumbinfo/${videoid}`)).text();
            let image_url = xml_first_search(xml_response, "thumbnail_url");
            const predict_long = 43 + 2 * (videoid.length - 2);
            const return_data: Record<string, any> = {};
            
            if (image_url.length > predict_long) {
              image_url += ".L";
            }
            
            if (image_url === "<?xml version=") {
              return_data["status"] = "invalid videoid";
              return_data["thumbnail_url"] = "";
            } else {
              return_data["status"] = "success";
              return_data["thumbnail_url"] = image_url;
              const search_element_names: Record<string, string> = {
                video_id: "video_id",
                title: "title",
                description: "description",
                length: "length",
                view_counter: "view_count",
                comment_num: "comment_count",
                mylist_counter: "mylist_count",
                first_retrieve: "publish_time",
                embeddable: "embedable",
                genre: "genre"
              };
              Object.keys(search_element_names).forEach(key_name => 
                return_data[search_element_names[key_name]] = xml_first_search(xml_response, key_name)
              );
            }
            multi_embed_player.api_cache[service][videoid] = return_data;
            break;

          case 'bilibili':
            const json_response_bilibili = await (await fetch(url + `https://api.bilibili.com/x/web-interface/view?bvid=${videoid}`)).json();
            if (json_response_bilibili?.data?.pic === undefined) {
              json_response_bilibili["image_base64"] = null;
            } else {
              json_response_bilibili["image_base64"] = url + json_response_bilibili.data.pic;
            }
            multi_embed_player.api_cache[service][videoid] = json_response_bilibili;
            break;

          case "youtube":
            try {
              const json_response_youtube = await (await fetch(url + `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoid}&format=json`)).json();
              json_response_youtube["image_base64"] = url + json_response_youtube["thumbnail_url"];
              multi_embed_player.api_cache[service][videoid] = json_response_youtube;
            } catch {
              multi_embed_player.api_cache[service][videoid] = {};
            }
            break;
        }
        const promise_data = multi_embed_player.api_promise[service]?.[videoid];
        if (promise_data) {
          promise_data.res.forEach(resolve => resolve());
        }
      }
    } catch {
      const promise_data = multi_embed_player.api_promise[service]?.[videoid];
      if (promise_data && "rej" in promise_data) {
        promise_data.rej.forEach(reject => reject());
      }
      if (failed_send_error && failed_send_error_target !== null) {
        failed_send_error_target.dispatchEvent(new CustomEvent("onError", { detail: { code: ErrorCode.NETWORK_ERROR } }));
      }
      multi_embed_player.api_cache[service][videoid] = {};
    }
  } else {
    let fetch_response: Response;
    try {
      const url = `${multi_embed_player.iframe_api_endpoint}?route=${service}&videoid=${videoid}` + (image_proxy ? "&image_base64=1" : "");
      if (multi_embed_player.api_promise[service]?.[videoid] === undefined) {
        if (!multi_embed_player.api_promise[service]) {
          multi_embed_player.api_promise[service] = {};
        }
        multi_embed_player.api_promise[service][videoid] = { res: [], rej: [] };
        fetch_response = await fetch(url);
        multi_embed_player.api_cache[service][videoid] = await fetch_response.json();
        multi_embed_player.api_promise[service][videoid].res.forEach(resolve => resolve());
      } else {
        await new Promise<void>((resolve, reject) => {
          multi_embed_player.api_promise[service][videoid].res.push(resolve);
          multi_embed_player.api_promise[service][videoid].rej.push(reject);
        });
      }
    } catch (e) {
      const promise_data = multi_embed_player.api_promise[service]?.[videoid];
      if (promise_data && "rej" in promise_data) {
        promise_data.rej.forEach(reject => reject());
      }
      if (failed_send_error && failed_send_error_target !== null) {
        failed_send_error_target.dispatchEvent(new CustomEvent("onError", { detail: { code: ErrorCode.NETWORK_ERROR } }));
      } else {
        multi_embed_player.api_cache[service][videoid] = {};
      }
    }
  }
};

/**
 * Resets all values in multi_embed_player.GDPR_accepted to false and removes the corresponding item from localStorage.
 */
const multi_embed_player_GDPR_accepted_all_back_down = (): void => {
  Object.keys(multi_embed_player.GDPR_accepted).forEach(key => (multi_embed_player.GDPR_accepted as any)[key] = false);
  localStorage.removeItem('multi_embed_player_GDPR_accepted');
};

/**
 * A custom HTML element for embedding multiple video services in a single player.
 * @extends HTMLElement
 */
export class multi_embed_player extends HTMLElement {
  static script_origin: string = "https://cdn.jsdelivr.net/gh/bonjinnorenka/multi_embed_player@v3/";
  static iframe_api_endpoint: string = "https://iframe_api.ryokuryu.workers.dev";
  static mep_status_load_api: MEPStatusLoadApi = { youtube: 0, niconico: 0, bilibili: 0, soundcloud: 0 };
  static mep_load_api_promise: MEPLoadApiPromise = { youtube: [], niconico: [], bilibili: [], soundcloud: [] };
  static api_cache: ApiCache = { niconico: {}, bilibili: {}, soundcloud: {}, youtube: {} };
  static api_promise: ApiPromise = { niconico: {}, bilibili: {}, soundcloud: {}, youtube: {} };
  static GDPR_accept_promise: MEPLoadApiPromise = { youtube: [], niconico: [], bilibili: [], soundcloud: [] };
  static iframe_api_class: IframeApiClass = {};
  static GDPR_accepted: GDPRAccepted = { youtube: false, niconico: false, bilibili: false, soundcloud: false };
  static possible_direct_access_services: string[] = ["youtube", "soundcloud"];
  static cors_proxy: string = ""; // if cors_proxy is not empty string, it use instead of iframe_api_endpoint and follow gdpr
  static tearms_policy_service: TearmsPolicyService = {
    "youtube": "https://www.youtube.com/t/terms",
    "niconico": "https://account.nicovideo.jp/rules/account?language=en-us",
    "bilibili": "https://www.bilibili.com/blackboard/protocal/activity-lc1L-pIoh.html",
    "soundcloud": "https://soundcloud.com/pages/privacy"
  };
  static follow_GDPR: boolean = false;

  private videoid: string | null = null;
  private service!: string;
  private image_url?: string | null;
  private picture_tag?: HTMLPictureElement;
  private follow_GDPR: boolean;

  constructor() {
    super();
    this.follow_GDPR = multi_embed_player.follow_GDPR;
  }

  async connectedCallback(): Promise<void> {
    if (this.getAttribute("follow_GDPR") === "true") {
      this.follow_GDPR = true;
    }
    if (this.getAttribute("type") === null || this.getAttribute("type") === "embed" || this.getAttribute("type") === "thumbnail-click") {
      this.videoid = this.getAttribute("videoid");
      this.service = this.getAttribute("service")!;
      if (this.getAttribute("img_url") != null) {
        this.image_url = this.getAttribute("img_url");
      } else if (this.getAttribute("picture_tag") != null) {
        this.picture_tag = document.createElement("picture");
        this.appendChild(this.picture_tag);
        this.picture_tag.innerHTML = this.getAttribute("picture_tag")!;
      } else {
        this.image_url = await this.mep_imageurl(this.videoid, this.service);
        if (!await this.check_image_status(this.image_url)) {
          this.image_url = await this.mep_imageurl(this.getAttribute("subVideoid"), this.getAttribute("subService"));
          if (!await this.check_image_status(this.image_url)) {
            this.style.backgroundImage = `${multi_embed_player.script_origin}icon/video_not_found.svgz`;
          }
        }
      }
      if (typeof this.image_url === "string") {
        this.style.backgroundImage = `url(${this.image_url})`;
      } else {
        this.style.backgroundImage = `url(${multi_embed_player.script_origin}icon/video_not_found.svgz)`;
      }
      //status setting
      if (this.getAttribute("type") === null || this.getAttribute("type") === "embed") {
        this.addEventListener('click', this.add_iframe, { once: true });
      }
      if (this.getAttribute("type") === "thumbnail-click") {
        this.addEventListener('click', () => { this.play_on_player(this.getAttribute("for")!, this.getAttribute("service")!, this.getAttribute("videoid")!, this.getAttribute("start"), this.getAttribute("end"), this.getAttribute("subService"), this.getAttribute("subVideoid")) });
        this.addEventListener('contextmenu', (e) => { e.preventDefault(); this.add_playlist() });
      }
    } else if (this.getAttribute("type") === "player") {
      // player initialization
    }
  }

  /**
   * Asynchronously fetches the image URL for a given video ID and service.
   */
  private async mep_imageurl(videoid: string | null, service: string | null): Promise<string | null> {
    let GDPR_accepted = false;
    if (!this.follow_GDPR) {
      GDPR_accepted = true;
         } else if (this.follow_GDPR && !(multi_embed_player.GDPR_accepted as any)[service!]) {
       GDPR_accepted = false;
     } else if (this.follow_GDPR && (multi_embed_player.GDPR_accepted as any)[service!]) {
      GDPR_accepted = true;
    }

    let image_url = "";
    let use_cors = false;
    if (GDPR_accepted) {
      if (multi_embed_player.cors_proxy !== "") {
        image_url = multi_embed_player.cors_proxy;
        use_cors = true;
      } else {
        image_url = `${multi_embed_player.iframe_api_endpoint}?route=url_proxy&url=`;
      }
    }
    if (multi_embed_player.cors_proxy !== "") {
      use_cors = true;
    }
    if (!GDPR_accepted || service === "bilibili") {
      if (!(videoid! in multi_embed_player.api_cache[service!])) {
        await multi_embed_player_fetch_iframe_api(service!, videoid!, use_cors, true, false);
      }
      return multi_embed_player.api_cache[service!][videoid!]["image_base64"];
    } else if (service === "soundcloud" || service === "youtube" || service === "niconico") {
      if (!(videoid! in multi_embed_player.api_cache[service!])) {
        await multi_embed_player_fetch_iframe_api(service!, videoid!, use_cors, !GDPR_accepted, GDPR_accepted);
      }
      if (!GDPR_accepted) {
        return multi_embed_player.api_cache[service!][videoid!]["image_base64"];
      } else {
        return multi_embed_player.api_cache[service!][videoid!]["thumbnail_url"];
      }
    } else {
      return "invalid_url";
    }
  }

  /**
   * Checks the status of an image URL.
   */
  private async check_image_status(img_url: string | null | undefined): Promise<boolean> {
    if (typeof img_url !== "string") {
      return false;
    }
    const img = new Image();
    img.src = img_url;
    return new Promise((resolve) => {
      img.onload = () => { img.remove(); resolve(true) };
      img.onerror = () => { img.remove(); resolve(false) };
    });
  }

  /**
   * This function adds an iframe to the current element.
   */
  private async add_iframe(): Promise<void> {
    // Implementation here
  }

  /**
   * Plays a video on the specified player with the given parameters.
   */
  private play_on_player(playerid: string, service: string, videoid: string, start: string | null, end: string | null, subService: string | null, subVideoid: string | null): void {
    // Implementation here
  }

  /**
   * Adds a new play item to the playlist of the player.
   */
  private add_playlist(): void {
    // Implementation here
  }
} 