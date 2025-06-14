import { BilibiliContent, BilibiliPlayerVars, IPlayer, PlayerState, EventHandler } from '../types';

interface BilibiliApiResponse {
  image_base64?: string;
  [key: string]: any;
}

interface BilibiliApiCache {
  [videoid: string]: BilibiliApiResponse;
}

interface BilibiliApiPromise {
  [videoid: string]: {
    res: Array<() => void>;
    rej: Array<() => void>;
  };
}

/**
 * Class representing a Bilibili player.
 */
export class mep_bilibili implements IPlayer {
  private static error_description: Record<number, string> = {
    0: "unknown error occurred",
    1: "data api endpoint invalid or throw error",
    2: "can't access local storage",
    3: "data api throw error",
    4: "player throw error direct"
  };
  
  private static localStorageCheck: boolean | null = null;
  private static mep_extension_bilibili: boolean = false;
  private static api_endpoint: string = "https://iframe_api.ryokuryu.workers.dev";
  private static no_extention_error: string = "you seems not to install mep_extension yet.if it not installed in your browser,you can't exact some function(mute unMute setVolume etc) and some function(getDuration,getPlayerState etc) will return incorrect data which is not reflect real data";
  private static player_base_url: string = "";
  private static bilibili_api_cache: BilibiliApiCache = {};
  private static cors_proxy: string = "";
  private static currentTime_delay: number = 2;
  private static bilibili_api_promise: BilibiliApiPromise = {};

  private player!: HTMLIFrameElement;
  private videoid!: string;
  private autoplay: number = 0;
  private startSeconds: number = 0;
  private endSeconds: number = -1;
  private displayComment: number = 1;
  private fastLoad: number = 0;
  private play_control_wrap: number = 1;
  private front_error_code?: number;
  private playerState: PlayerState = PlayerState.UNSTARTED;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 100;
  private muted: boolean = false;

  constructor(
    replacing_element: string | HTMLElement,
    content: BilibiliContent,
    player_set_event_function?: EventHandler
  ) {
    this.initialize_player_base_url();
    this.element_constructor(replacing_element, content, player_set_event_function);
  }

  /**
   * Initialize player base URL based on browser.
   */
  private initialize_player_base_url(): void {
    if (mep_bilibili.player_base_url === "") {
      const ua = navigator.userAgent;
      if (ua.indexOf("Firefox") !== -1 || ua.indexOf("Edg") !== -1) {
        mep_bilibili.player_base_url = "https://www.bilibili.com/blackboard/webplayer/embed-old.html?";
      } else {
        mep_bilibili.player_base_url = "https://player.bilibili.com/player.html?";
      }
    }
  }

  /**
   * Constructor for element setup.
   */
  private async element_constructor(
    replacing_element: string | HTMLElement,
    content: BilibiliContent,
    player_set_event_function?: EventHandler
  ): Promise<void> {
    try {
      this.player = document.createElement("iframe") as HTMLIFrameElement;
      
      if (typeof player_set_event_function === "function") {
        player_set_event_function();
      }

      let iframe_replace_node: HTMLElement;
      if (typeof replacing_element === "string") {
        const element = document.getElementById(replacing_element);
        if (!element) {
          throw new Error(`Element with id "${replacing_element}" not found`);
        }
        iframe_replace_node = element;
      } else {
        iframe_replace_node = replacing_element;
      }

      this.videoid = content.videoId;
      const playerVars = content.playerVars || {};

      // Set player variables
      this.autoplay = playerVars.autoplay || 0;
      this.startSeconds = playerVars.startSeconds || 0;
      this.endSeconds = playerVars.endSeconds || -1;
      this.displayComment = playerVars.displayComment !== undefined ? playerVars.displayComment : 1;
      this.fastLoad = playerVars.fastLoad || 0;
      this.play_control_wrap = playerVars.play_control_wrap !== undefined ? playerVars.play_control_wrap : 1;

      // Check local storage access
      if (mep_bilibili.localStorageCheck === null) {
        try {
          localStorage.setItem("mep_bilibili_test", "test");
          localStorage.removeItem("mep_bilibili_test");
          mep_bilibili.localStorageCheck = true;
        } catch {
          mep_bilibili.localStorageCheck = false;
          this.front_error_code = 2;
          this.add_error_description();
          return;
        }
      }

      // Check extension
      mep_bilibili.mep_extension_bilibili = localStorage.getItem("mep_extension_bilibili") === "true";

      this.add_player_css_style();
      this.player.classList.add("mep_bilibili_player");
      
      // Set iframe attributes
      this.player.width = String(content.width || 560);
      this.player.height = String(content.height || 315);
      this.player.allow = "autoplay; fullscreen";
      this.player.allowFullscreen = true;
      this.player.referrerPolicy = "no-referrer";

      // Replace element
      iframe_replace_node.replaceWith(this.player);

      // Load video
      await this.image_player(true);

    } catch (error) {
      console.error("Error in element_constructor:", error);
      this.front_error_code = 0;
      this.add_error_description();
    }
  }

  /**
   * Display image player when paused.
   */
  private async image_player(first_load: boolean = false): Promise<void> {
    try {
      let exist_img_children = false;
      const parent_element = this.player.parentElement;
      if (!parent_element) return;

      parent_element.childNodes.forEach((node) => {
        if (node.nodeName === "IMG") {
          exist_img_children = true;
        }
        if (node.nodeName === "DIV" && (node as HTMLElement).classList.contains("mep_bilibili_transparent")) {
          node.remove();
        }
      });

      if (!exist_img_children && this.play_control_wrap) {
        const img_element = document.createElement("img");
        const video_data = await this.getVideodataApi();
        img_element.src = video_data.image_base64 || "";
        img_element.width = parseInt(this.player.width);
        img_element.height = parseInt(this.player.height);
        img_element.style.width = "100%";
        img_element.style.height = "100%";
        img_element.style.objectFit = "cover";
        img_element.style.cursor = "pointer";
        img_element.addEventListener("click", () => {
          this.playVideo();
        });
        parent_element.prepend(img_element);
      }

      this.player.hidden = true;
      this.player.src = "";
      
      if (first_load) {
        this.player.dispatchEvent(new Event("onReady"));
      }
    } catch (error) {
      console.error("Error in image_player:", error);
    }
  }

  /**
   * Set pause transparent overlay.
   */
  private set_pause_transparent(): void {
    let exist_div_children = false;
    const parent_element = this.player.parentElement;
    if (!parent_element) return;

    parent_element.childNodes.forEach((node) => {
      if (node.nodeName === "DIV" && (node as HTMLElement).classList.contains("mep_bilibili_transparent")) {
        exist_div_children = true;
      }
    });

    if (!exist_div_children && this.play_control_wrap) {
      const div_element = document.createElement("div");
      div_element.classList.add("mep_bilibili_transparent");
      div_element.style.width = "100%";
      div_element.style.height = "100%";
      div_element.style.zIndex = "1";
      div_element.style.position = "absolute";
      div_element.style.cursor = "pointer";
      div_element.addEventListener("click", () => {
        this.pauseVideo();
      });
      parent_element.prepend(div_element);
    }
  }

  /**
   * Add loading animation.
   */
  private add_loading_animation(): void {
    let exist_mep_load_animation = false;
    Array.from(document.head.getElementsByClassName("mep_load_animation")).forEach((element) => {
      if (element.nodeName === "STYLE") {
        exist_mep_load_animation = true;
      }
    });

    if (!exist_mep_load_animation) {
      const style_element = document.createElement("style");
      style_element.classList.add("mep_load_animation");
      style_element.innerHTML = `
      .mep_loading_animation{
          border: 12px solid #fafafa;
          border-radius: 50%;
          border-top: 12px solid #3498db;
          width: 100px;
          height: 100px;
          animation: spin 1s linear infinite;
      }
      @keyframes spin{
          0%{
              transform: rotate(0deg);
          }  
          100%{
              transform: rotate(360deg);
          }
      }`;
      document.head.appendChild(style_element);
    }

    let exist_animation_div = false;
    const parent_element = this.player.parentElement;
    if (!parent_element) return;

    parent_element.childNodes.forEach((node) => {
      if (node.nodeName === "DIV" && (node as HTMLElement).classList.contains("mep_loading_animation")) {
        exist_animation_div = true;
      }
    });

    if (!exist_animation_div) {
      const div_element = document.createElement("div");
      div_element.classList.add("mep_loading_animation");
      div_element.style.zIndex = "2";
      div_element.style.top = "calc(50% - 50px)";
      div_element.style.left = "calc(50% - 50px)";
      div_element.style.position = "absolute";
      parent_element.prepend(div_element);
    }
  }

  /**
   * Remove loading animation.
   */
  private remove_loading_animation(): void {
    const parent_element = this.player.parentElement;
    if (!parent_element) return;

    parent_element.childNodes.forEach((node) => {
      if (node.nodeName === "DIV" && (node as HTMLElement).classList.contains("mep_loading_animation")) {
        node.remove();
      }
    });
  }

  /**
   * Add error description.
   */
  private add_error_description(): void {
    const error_description_document = document.createElement("div");
    error_description_document.style.width = "100%";
    error_description_document.style.height = "100%";
    let error_message = "unknown error occurred";
    if (this.front_error_code !== undefined && mep_bilibili.error_description[this.front_error_code] !== undefined) {
      error_message = mep_bilibili.error_description[this.front_error_code] + "\n front end error code:" + String(this.front_error_code);
    }
    error_description_document.innerText = error_message;
    this.player.replaceWith(error_description_document);
    this.player = error_description_document as any;
    try {
      const parent_element = this.player.parentElement;
      if (parent_element) {
        (parent_element as any).style.backgroundImage = "";
      }
    } catch {}
  }

  /**
   * Add player CSS style.
   */
  private add_player_css_style(): void {
    let exist_mep_bilibili_player_css = false;
    Array.from(document.head.getElementsByClassName("mep_bilibili_player_css")).forEach((element) => {
      if (element.nodeName === "STYLE") {
        exist_mep_bilibili_player_css = true;
      }
    });

    if (!exist_mep_bilibili_player_css) {
      const style_element = document.createElement("style");
      style_element.classList.add("mep_bilibili_player_css");
      style_element.innerHTML = `
      .mep_bilibili_player{
          border: none;
          width: 100%;
          height: 100%;
      }`;
      document.head.appendChild(style_element);
    }
  }

  /**
   * Get video data from API.
   */
  private async getVideodataApi(): Promise<BilibiliApiResponse> {
    return new Promise(async (resolve, reject) => {
      if (!(this.videoid in mep_bilibili.bilibili_api_cache)) {
        if (mep_bilibili.bilibili_api_promise[this.videoid] === undefined) {
          mep_bilibili.bilibili_api_promise[this.videoid] = { res: [], rej: [] };
          try {
            if (mep_bilibili.cors_proxy === "") {
              mep_bilibili.bilibili_api_cache[this.videoid] = await (await fetch(`${mep_bilibili.api_endpoint}?route=bilibili&videoid=${this.videoid}&image_base64=1`)).json();
            } else {
              const json_response_bilibili = await (await fetch(mep_bilibili.cors_proxy + `https://api.bilibili.com/x/web-interface/view?bvid=${this.videoid}`)).json();
              if (json_response_bilibili?.data?.pic === undefined) {
                json_response_bilibili["image_base64"] = null;
              } else {
                json_response_bilibili["image_base64"] = mep_bilibili.cors_proxy + json_response_bilibili.data.pic;
              }
              mep_bilibili.bilibili_api_cache[this.videoid] = json_response_bilibili;
            }
          } catch {
            console.error("error occurred when get bilibili api. Are you sure you overwrite iframe_api endpoint? or cors proxy is not working?");
            this.front_error_code = 1;
            this.player.dispatchEvent(new CustomEvent("onError", { detail: { code: 1100 } }));
          }
                     mep_bilibili.bilibili_api_promise[this.videoid].res.forEach((resolveFunc) => { resolveFunc() });
           resolve(mep_bilibili.bilibili_api_cache[this.videoid]);
                 } else {
           mep_bilibili.bilibili_api_promise[this.videoid].res.push(() => resolve(mep_bilibili.bilibili_api_cache[this.videoid]));
           mep_bilibili.bilibili_api_promise[this.videoid].rej.push(() => reject());
          return;
        }
      } else {
        resolve(mep_bilibili.bilibili_api_cache[this.videoid]);
      }
    });
  }

  // IPlayer interface implementation
  playVideo(): void {
    if (!mep_bilibili.mep_extension_bilibili) {
      this.set_pause_transparent();
      // Implementation for non-extension mode
    } else {
      (this.player.contentWindow as any).postMessage({ eventName: "play" }, "*");
    }
  }

  pauseVideo(): void {
    if (!mep_bilibili.mep_extension_bilibili) {
      this.image_player();
    } else {
      (this.player.contentWindow as any).postMessage({ eventName: "pause" }, "*");
    }
  }

  getCurrentTime(): Promise<number> {
    return Promise.resolve(this.currentTime);
  }

  getDuration(): Promise<number> {
    return Promise.resolve(this.duration);
  }

  async seekTo(time: number): Promise<void> {
    const num_time = Number(time);
    if (isNaN(num_time) || num_time < 0) {
      console.error("Invalid time value");
      return;
    }

    if (!mep_bilibili.mep_extension_bilibili) {
      // Implementation for non-extension mode
    } else {
      (this.player.contentWindow as any).postMessage({ eventName: "seek", seekTime: num_time }, "*");
    }
  }

  setVolume(volume: number): void {
    const num_volume = Number(volume);
    if (isNaN(num_volume) || num_volume < 0 || num_volume > 100) {
      console.error("Invalid volume value");
      return;
    }

    if (!mep_bilibili.mep_extension_bilibili) {
      console.warn(mep_bilibili.no_extention_error);
    } else {
      (this.player.contentWindow as any).postMessage({ eventName: "setVolume", volume: num_volume / 100 }, "*");
    }
  }

  getVolume(): Promise<number> {
    if (!mep_bilibili.mep_extension_bilibili) {
      console.warn(mep_bilibili.no_extention_error);
      return Promise.resolve(this.volume);
    } else {
      return Promise.resolve(this.volume);
    }
  }

  mute(): void {
    if (!mep_bilibili.mep_extension_bilibili) {
      console.warn(mep_bilibili.no_extention_error);
    } else {
      this.volume = this.volume; // Store current volume
      (this.player.contentWindow as any).postMessage({ eventName: "setVolume", volume: 0 }, "*");
    }
  }

  unMute(): void {
    if (!mep_bilibili.mep_extension_bilibili) {
      console.warn(mep_bilibili.no_extention_error);
    } else {
      (this.player.contentWindow as any).postMessage({ eventName: "setVolume", volume: this.volume / 100 }, "*");
    }
  }

  isMuted(): Promise<boolean> {
    return Promise.resolve(this.muted);
  }

  getPlayerState(): Promise<PlayerState> {
    return Promise.resolve(this.playerState);
  }

  /**
   * Get real duration between start and end times.
   */
  async getRealDulation(): Promise<number> {
    const duration = await this.getDuration();
    if (this.endSeconds === -1) {
      return duration - this.startSeconds;
    } else {
      return this.endSeconds - this.startSeconds;
    }
  }

  /**
   * Load video by ID.
   */
  loadVideoById(content: BilibiliContent): void {
    this.videoid = content.videoId;
    const playerVars = content.playerVars || {};
    
    this.autoplay = playerVars.autoplay || 0;
    this.startSeconds = playerVars.startSeconds || 0;
    this.endSeconds = playerVars.endSeconds || -1;
    
    // Implementation for loading video
  }

  /**
   * Cue video by ID.
   */
  cueVideoById(content: BilibiliContent): void {
    this.videoid = content.videoId;
    const playerVars = content.playerVars || {};
    
    this.autoplay = 0; // Don't autoplay when cueing
    this.startSeconds = playerVars.startSeconds || 0;
    this.endSeconds = playerVars.endSeconds || -1;
    
    // Implementation for cueing video
  }
} 