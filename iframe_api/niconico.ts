import { NiconicoContent, NiconicoPlayerVars, IPlayer, PlayerState, EventHandler } from '../types';

/**
 * Class representing a Niconico player.
 */
export class mep_niconico implements IPlayer {
  private player!: HTMLIFrameElement;
  private videoid!: string;
  private autoplay: number = 0;
  private startSeconds: number = 0;
  private endSeconds: number = -1;
  private playerState: PlayerState = PlayerState.UNSTARTED;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 100;
  private muted: boolean = false;

  constructor(
    replacing_element: string | HTMLElement,
    content: NiconicoContent,
    player_set_event_function?: EventHandler
  ) {
    this.load(replacing_element, content, player_set_event_function);
  }

  private async load(
    replacing_element: string | HTMLElement,
    content: NiconicoContent,
    player_set_event_function?: EventHandler
  ): Promise<void> {
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

    // Set iframe attributes
    this.player.width = String(content.width || 560);
    this.player.height = String(content.height || 315);
    this.player.allow = "autoplay; fullscreen";
    this.player.allowFullscreen = true;
    this.player.style.border = "none";

    // Build URL with parameters
    const params = new URLSearchParams();
    params.set('v', this.videoid);
    if (this.autoplay) params.set('autoplay', '1');
    if (this.startSeconds) params.set('from', String(this.startSeconds));
    if (this.endSeconds !== -1) params.set('to', String(this.endSeconds));
    if (playerVars.mute) params.set('mute', '1');
    if (playerVars.noRelatedVideo) params.set('noRelatedVideo', '1');
    if (playerVars.noLogo) params.set('noLogo', '1');
    if (playerVars.noController) params.set('noController', '1');
    if (playerVars.noHeader) params.set('noHeader', '1');
    if (playerVars.noTags) params.set('noTags', '1');
    if (playerVars.noShare) params.set('noShare', '1');

    this.player.src = `https://embed.nicovideo.jp/watch/${this.videoid}?${params.toString()}`;

    // Replace element
    iframe_replace_node.replaceWith(this.player);

    // Dispatch ready event
    setTimeout(() => {
      this.player.dispatchEvent(new Event("onReady"));
    }, 1000);
  }

  // IPlayer interface implementation
  playVideo(): void {
    // Niconico doesn't provide direct control through iframe
    // This would require postMessage communication
    console.log("Play video - Niconico iframe doesn't support direct control");
  }

  pauseVideo(): void {
    // Niconico doesn't provide direct control through iframe
    console.log("Pause video - Niconico iframe doesn't support direct control");
  }

  getCurrentTime(): Promise<number> {
    // Return estimated time based on when playback started
    return Promise.resolve(this.currentTime);
  }

  getDuration(): Promise<number> {
    // Would need to be fetched from Niconico API
    return Promise.resolve(this.duration);
  }

  async seekTo(time: number): Promise<void> {
    const num_time = Number(time);
    if (isNaN(num_time) || num_time < 0) {
      console.error("Invalid time value");
      return;
    }
    
    // Update internal time tracking
    this.currentTime = this.startSeconds + num_time;
    console.log("Seek to - Niconico iframe doesn't support direct control");
  }

  setVolume(volume: number): void {
    const num_volume = Number(volume);
    if (isNaN(num_volume) || num_volume < 0 || num_volume > 100) {
      console.error("Invalid volume value");
      return;
    }
    
    this.volume = num_volume;
    console.log("Set volume - Niconico iframe doesn't support direct control");
  }

  getVolume(): Promise<number> {
    return Promise.resolve(this.volume);
  }

  mute(): void {
    this.muted = true;
    console.log("Mute - Niconico iframe doesn't support direct control");
  }

  unMute(): void {
    this.muted = false;
    console.log("Unmute - Niconico iframe doesn't support direct control");
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
  loadVideoById(content: NiconicoContent): void {
    this.videoid = content.videoId;
    const playerVars = content.playerVars || {};
    
    this.autoplay = playerVars.autoplay || 0;
    this.startSeconds = playerVars.startSeconds || 0;
    this.endSeconds = playerVars.endSeconds || -1;
    
    // Reload iframe with new video
    const params = new URLSearchParams();
    params.set('v', this.videoid);
    if (this.autoplay) params.set('autoplay', '1');
    if (this.startSeconds) params.set('from', String(this.startSeconds));
    if (this.endSeconds !== -1) params.set('to', String(this.endSeconds));
    
    this.player.src = `https://embed.nicovideo.jp/watch/${this.videoid}?${params.toString()}`;
  }

  /**
   * Cue video by ID.
   */
  cueVideoById(content: NiconicoContent): void {
    this.videoid = content.videoId;
    const playerVars = content.playerVars || {};
    
    this.autoplay = 0; // Don't autoplay when cueing
    this.startSeconds = playerVars.startSeconds || 0;
    this.endSeconds = playerVars.endSeconds || -1;
    
    // Load without autoplay
    const params = new URLSearchParams();
    params.set('v', this.videoid);
    if (this.startSeconds) params.set('from', String(this.startSeconds));
    if (this.endSeconds !== -1) params.set('to', String(this.endSeconds));
    
    this.player.src = `https://embed.nicovideo.jp/watch/${this.videoid}?${params.toString()}`;
  }
} 