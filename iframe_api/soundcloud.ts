import { SoundCloudContent, SoundCloudPlayerVars, IPlayer, PlayerState, EventHandler } from '../types';

interface SoundCloudWidget {
  bind(event: string, callback: () => void): void;
  play(): void;
  pause(): void;
  toggle(): void;
  seekTo(milliseconds: number): void;
  setVolume(volume: number): void;
  next(): void;
  prev(): void;
  skip(soundIndex: number): void;
  load(url: string, options?: any): void;
  reload(): void;
  getVolume(callback: (volume: number) => void): void;
  getDuration(callback: (duration: number) => void): void;
  getPosition(callback: (position: number) => void): void;
  getSounds(callback: (sounds: any[]) => void): void;
  getCurrentSound(callback: (sound: any) => void): void;
  getCurrentSoundIndex(callback: (index: number) => void): void;
  isPaused(callback: (paused: boolean) => void): void;
}

declare global {
  interface Window {
    SC: {
      Widget: {
        (iframe: HTMLIFrameElement): SoundCloudWidget;
      };
    };
  }
}

/**
 * Class representing a SoundCloud player.
 */
export class mep_soundcloud implements IPlayer {
  private static soundcloud_api_loaded: number = 0;
  private static soundcloud_api_promise: Array<() => void> = [];

  private player!: HTMLElement;
  private iframe!: HTMLIFrameElement;
  private widget!: SoundCloudWidget;
  private autoplay: number = 0;
  private startSeconds: number = 0;
  private endSeconds: number = -1;
  private playerState: PlayerState = PlayerState.UNSTARTED;
  private currentTime: number = 0;
  private duration: number = 0;
  private volume: number = 100;
  private muted: boolean = false;

  /**
   * Load SoundCloud Widget API asynchronously.
   */
  private async load_soundcloud_api(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (mep_soundcloud.soundcloud_api_loaded === 0) {
        mep_soundcloud.soundcloud_api_loaded = 1;
        const script = document.createElement("script");
        script.src = "https://w.soundcloud.com/player/api.js";
        script.addEventListener("load", () => {
          mep_soundcloud.soundcloud_api_promise.forEach(func => func());
          mep_soundcloud.soundcloud_api_loaded = 2;
          resolve();
        });
        document.body.appendChild(script);
      } else if (mep_soundcloud.soundcloud_api_loaded === 1) {
        mep_soundcloud.soundcloud_api_promise.push(resolve);
      } else {
        resolve();
      }
    });
  }

  constructor(
    replacing_element: string | HTMLElement,
    content: SoundCloudContent,
    player_set_event_function?: EventHandler
  ) {
    this.load(replacing_element, content, player_set_event_function);
  }

  private async load(
    replacing_element: string | HTMLElement,
    content: SoundCloudContent,
    player_set_event_function?: EventHandler
  ): Promise<void> {
    this.player = document.createElement("div");
    if (typeof player_set_event_function === "function") {
      player_set_event_function();
    }

    await this.load_soundcloud_api();

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
    this.autoplay = playerVars.autoplay || 0;
    this.startSeconds = playerVars.startSeconds || 0;
    this.endSeconds = playerVars.endSeconds || -1;

    // Create iframe
    this.iframe = document.createElement("iframe");
    this.iframe.width = String(content.width || 560);
    this.iframe.height = String(content.height || 315);
    this.iframe.allow = "autoplay";
    this.iframe.src = `https://w.soundcloud.com/player/?url=https://soundcloud.com/${content.videoId}&auto_play=${this.autoplay}&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true`;

    iframe_replace_node.replaceWith(this.iframe);

    // Initialize widget
    this.widget = window.SC.Widget(this.iframe);
    this.setup_event_listeners();
  }

  private setup_event_listeners(): void {
    this.widget.bind('ready', () => {
      this.player.dispatchEvent(new Event("onReady"));
    });

    this.widget.bind('play', () => {
      this.playerState = PlayerState.PLAYING;
      this.player.dispatchEvent(new CustomEvent("onStateChange", { detail: this.playerState }));
    });

    this.widget.bind('pause', () => {
      this.playerState = PlayerState.PAUSED;
      this.player.dispatchEvent(new CustomEvent("onStateChange", { detail: this.playerState }));
    });

    this.widget.bind('finish', () => {
      this.playerState = PlayerState.ENDED;
      this.player.dispatchEvent(new Event("onEndVideo"));
    });
  }

  // IPlayer interface implementation
  playVideo(): void {
    this.widget.play();
  }

  pauseVideo(): void {
    this.widget.pause();
  }

  getCurrentTime(): Promise<number> {
    return new Promise((resolve) => {
      this.widget.getPosition((position) => {
        resolve(position / 1000); // Convert to seconds
      });
    });
  }

  getDuration(): Promise<number> {
    return new Promise((resolve) => {
      this.widget.getDuration((duration) => {
        resolve(duration / 1000); // Convert to seconds
      });
    });
  }

  async seekTo(time: number): Promise<void> {
    const num_time = Number(time);
    if (isNaN(num_time) || num_time < 0) {
      console.error("Invalid time value");
      return;
    }
    this.widget.seekTo((this.startSeconds + num_time) * 1000); // Convert to milliseconds
  }

  setVolume(volume: number): void {
    const num_volume = Number(volume);
    if (isNaN(num_volume) || num_volume < 0 || num_volume > 100) {
      console.error("Invalid volume value");
      return;
    }
    this.widget.setVolume(num_volume / 100); // SoundCloud expects 0-1 range
    this.volume = num_volume;
  }

  getVolume(): Promise<number> {
    return new Promise((resolve) => {
      this.widget.getVolume((volume) => {
        resolve(volume * 100); // Convert to 0-100 range
      });
    });
  }

  mute(): void {
    this.widget.setVolume(0);
    this.muted = true;
  }

  unMute(): void {
    this.widget.setVolume(this.volume / 100);
    this.muted = false;
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
   * Load track by ID.
   */
  loadVideoById(content: SoundCloudContent): void {
    const url = `https://soundcloud.com/${content.videoId}`;
    this.widget.load(url, {
      auto_play: this.autoplay === 1,
      callback: () => {
        this.player.dispatchEvent(new Event("onReady"));
      }
    });
  }

  /**
   * Cue track by ID.
   */
  cueVideoById(content: SoundCloudContent): void {
    const url = `https://soundcloud.com/${content.videoId}`;
    this.widget.load(url, {
      auto_play: false,
      callback: () => {
        this.player.dispatchEvent(new Event("onReady"));
      }
    });
  }
} 