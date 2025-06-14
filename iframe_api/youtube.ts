import { YouTubeContent, YouTubePlayerVars, IPlayer, PlayerState, ErrorCode, EventHandler } from '../types';

// YouTube API の型定義
declare global {
  interface Window {
    YT: {
      Player: new (element: string | HTMLElement, config: YTPlayerConfig) => YTPlayer;
      ready: (callback: () => void) => void;
    };
  }
}

interface YTPlayerConfig {
  height: string;
  width: string;
  videoId: string;
  playerVars: Record<string, any>;
  host: string;
  events: {
    onReady: () => void;
    onError: (event: { data: number }) => void;
    onStateChange: () => void;
  };
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  getDuration(): number;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  setVolume(volume: number): void;
  getVolume(): number;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getPlayerState(): number;
  loadVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
  cueVideoById(videoId: string, startSeconds?: number, suggestedQuality?: string): void;
}

/**
 * Class representing a YouTube player.
 */
export class mep_youtube implements IPlayer {
  private static youtube_api_loaded: number = 0;
  private static youtube_api_promise: Array<() => void> = [];

  private player!: HTMLElement;
  private YT_player!: YTPlayer;
  private autoplay: number = 0;
  private startSeconds: number = 0;
  private endSeconds: number = -1;
  private el!: HTMLElement;

  /**
   * Load YouTube Iframe API asynchronously.
   */
  private async load_youtube_api(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (mep_youtube.youtube_api_loaded === 0) {
        mep_youtube.youtube_api_loaded = 1;
        const script_doc = document.createElement("script");
        script_doc.src = "https://www.youtube.com/iframe_api";
        script_doc.addEventListener("load", () => {
          window.YT.ready(() => {
            mep_youtube.youtube_api_promise.forEach(func => func());
            mep_youtube.youtube_api_loaded = 2;
            resolve();
          });
        });
        document.body.appendChild(script_doc);
      } else if (mep_youtube.youtube_api_loaded === 1) {
        mep_youtube.youtube_api_promise.push(resolve);
      } else {
        resolve();
      }
    });
  }

  /**
   * Create a new YouTube player instance.
   */
  constructor(
    replacing_element: string | HTMLElement,
    content: YouTubeContent,
    player_set_event_function?: EventHandler
  ) {
    this.load(replacing_element, content, player_set_event_function);
  }

  /**
   * Load the YouTube player.
   */
  private async load(
    replacing_element: string | HTMLElement,
    content: YouTubeContent,
    player_set_event_function?: EventHandler
  ): Promise<void> {
    this.player = document.createElement("div"); // dummy
    if (typeof player_set_event_function === "function") {
      player_set_event_function();
    }
    
    await this.load_youtube_api();
    
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

    const playerVars = content.playerVars || {};
    const player_vars_pass_over: Record<string, any> = {};

    this.autoplay = 0;
    if (playerVars.autoplay) {
      this.autoplay = 1;
      player_vars_pass_over.autoplay = 1;
    } else {
      player_vars_pass_over.autoplay = 0;
    }

    this.startSeconds = 0;
    this.endSeconds = -1;
    
    if (playerVars.startSeconds) {
      this.startSeconds = playerVars.startSeconds;
      player_vars_pass_over.start = playerVars.startSeconds;
    }
    
    if (playerVars.endSeconds) {
      this.endSeconds = playerVars.endSeconds;
      player_vars_pass_over.end = playerVars.endSeconds;
    }

    this.el = iframe_replace_node;
    this.YT_player = new window.YT.Player(iframe_replace_node, {
      height: "315",
      width: "560",
      videoId: content.videoId,
      playerVars: player_vars_pass_over,
      host: "https://www.youtube-nocookie.com",
      events: {
        onReady: () => {
          this.dispatch_event(new Event("onReady"));
        },
        onError: (e) => {
          this.error_event_handler(e);
        },
        onStateChange: () => {
          this.dispatch_event(new CustomEvent("onStateChange", { detail: this.getPlayerState() }));
          if (this.getPlayerState() === PlayerState.ENDED) {
            this.dispatch_event(new Event("onEndVideo"));
          }
        }
      }
    });

    if (!this.autoplay) {
      this.player.addEventListener("onReady", () => {
        this.pauseVideo();
      }, { once: true });
    }
  }

  /**
   * Handle error events from the player.
   */
  private error_event_handler(event: { data: number }): void {
    let code = 520;
    switch (event.data) {
      case 2:
        code = ErrorCode.INVALID_PARAMETER;
        break;
      case 5:
        code = ErrorCode.HTML5_ERROR;
        break;
      case 100:
        code = ErrorCode.VIDEO_NOT_FOUND;
        break;
      case 101:
      case 150:
        code = ErrorCode.EMBED_NOT_ALLOWED;
        break;
    }
    this.player.dispatchEvent(new CustomEvent("onError", { detail: { code } }));
  }

  /**
   * Dispatch event to the player element.
   */
  private dispatch_event(event: Event | CustomEvent): void {
    this.player.dispatchEvent(event);
  }

  /**
   * Play the video.
   */
  playVideo(): void {
    this.YT_player.playVideo();
  }

  /**
   * Pause the video.
   */
  pauseVideo(): void {
    this.YT_player.pauseVideo();
  }

  /**
   * Get the current time of the video.
   */
  getCurrentTime(): number {
    return this.YT_player.getCurrentTime();
  }

  /**
   * Get the duration of the video.
   */
  getDuration(): number {
    return this.YT_player.getDuration();
  }

  /**
   * Get the actual duration between the start and end times.
   */
  getRealDulation(): number {
    if (this.endSeconds == -1) {
      return this.getDuration() - this.startSeconds;
    } else {
      return this.endSeconds - this.startSeconds;
    }
  }

  /**
   * Seek to a specific time in the video.
   */
  seekTo(time: number): void {
    // try to time as number
    time = Number(time);
    if (isNaN(time)) {
      console.error("time is not a number(Nan error)");
      return;
    }
    if (time < 0) {
      time = 0;
    }
    this.YT_player.seekTo(time);
  }

  /**
   * Set the volume of the player.
   */
  setVolume(volume: number): void {
    if (typeof volume === "number" && volume >= 0 && volume <= 100) {
      this.YT_player.setVolume(volume);
    } else {
      console.error("volume is not a number or not in range 0-100");
    }
  }

  /**
   * Mute the player.
   */
  mute(): void {
    this.YT_player.mute();
  }

  /**
   * Unmute the player.
   */
  unMute(): void {
    this.YT_player.unMute();
  }

  /**
   * Check if the player is muted.
   */
  isMuted(): boolean {
    return this.YT_player.isMuted();
  }

  /**
   * Get the current volume of the player.
   */
  getVolume(): number {
    return this.YT_player.getVolume();
  }

  /**
   * Get the current state of the player.
   */
  getPlayerState(): PlayerState {
    let nowstatus = this.YT_player.getPlayerState();
    if ((this.getCurrentTime() > this.getDuration() - 1 && this.getCurrentTime() != 0 && this.getDuration() != 0) || (this.endSeconds != -1 && this.endSeconds - 1 <= this.getCurrentTime())) {
      return PlayerState.ENDED;
    } else if (nowstatus == -1) {
      return PlayerState.UNSTARTED;
    } else if (nowstatus == 0) {
      return PlayerState.ENDED;
    } else if (nowstatus == 1) {
      return PlayerState.PLAYING;
    } else if (nowstatus == 2) {
      return PlayerState.PAUSED;
    } else if (nowstatus == 3 || nowstatus == 5) {
      return PlayerState.BUFFERING;
    }
    return PlayerState.UNSTARTED;
  }

  /**
   * Get the title of the currently loaded video.
   */
  getTitle(): string {
    return (this.YT_player as any).getVideoData().title;
  }

  /**
   * Load a new video by ID.
   */
  loadVideoById(content: YouTubeContent, startSeconds?: number): void {
    if (typeof content === "object") {
      this.YT_player.loadVideoById(content.videoId, startSeconds);
    } else {
      this.YT_player.loadVideoById(content as any, startSeconds);
    }
  }

  /**
   * Cue a new video by ID.
   */
  cueVideoById(content: YouTubeContent, startSeconds?: number): void {
    if (typeof content === "object") {
      this.YT_player.cueVideoById(content.videoId, startSeconds);
    } else {
      this.YT_player.cueVideoById(content as any, startSeconds);
    }
  }
} 