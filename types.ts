// 共通の型定義

export interface PlayerVars {
  autoplay?: number;
  startSeconds?: number;
  endSeconds?: number;
}

export interface VideoContent {
  videoId: string;
  width?: number;
  height?: number;
  playerVars?: PlayerVars;
}

export interface ApiCache {
  [service: string]: {
    [videoid: string]: any;
  };
}

export interface ApiPromise {
  [service: string]: {
    [videoid: string]: {
      res: Array<() => void>;
      rej: Array<() => void>;
    };
  };
}

export interface GDPRAccepted {
  youtube: boolean;
  niconico: boolean;
  bilibili: boolean;
  soundcloud: boolean;
}

export interface MEPStatusLoadApi {
  youtube: number;
  niconico: number;
  bilibili: number;
  soundcloud: number;
}

export interface MEPLoadApiPromise {
  youtube: Array<() => void>;
  niconico: Array<() => void>;
  bilibili: Array<() => void>;
  soundcloud: Array<() => void>;
}

export interface IframeApiClass {
  [service: string]: any;
}

export interface TearmsPolicyService {
  youtube: string;
  niconico: string;
  bilibili: string;
  soundcloud: string;
}

// YouTube関連の型定義
export interface YouTubePlayerVars extends PlayerVars {
  start?: number;
  end?: number;
}

export interface YouTubeContent extends VideoContent {
  playerVars?: YouTubePlayerVars;
}

// Bilibili関連の型定義
export interface BilibiliPlayerVars extends PlayerVars {
  displayComment?: number;
  fastLoad?: number;
  play_control_wrap?: number;
}

export interface BilibiliContent extends VideoContent {
  playerVars?: BilibiliPlayerVars;
}

// SoundCloud関連の型定義
export interface SoundCloudPlayerVars extends PlayerVars {
  color?: string;
  auto_play?: boolean;
  hide_related?: boolean;
  show_comments?: boolean;
  show_user?: boolean;
  show_reposts?: boolean;
  show_teaser?: boolean;
  visual?: boolean;
}

export interface SoundCloudContent extends VideoContent {
  playerVars?: SoundCloudPlayerVars;
}

// Niconico関連の型定義
export interface NiconicoPlayerVars extends PlayerVars {
  mute?: number;
  noRelatedVideo?: number;
  noLogo?: number;
  noController?: number;
  noHeader?: number;
  noTags?: number;
  noShare?: number;
}

export interface NiconicoContent extends VideoContent {
  playerVars?: NiconicoPlayerVars;
}

// プレイヤーの状態
export enum PlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5
}

// エラーコード
export enum ErrorCode {
  INVALID_PARAMETER = 2,
  HTML5_ERROR = 5,
  VIDEO_NOT_FOUND = 100,
  EMBED_NOT_ALLOWED = 101,
  EMBED_NOT_ALLOWED_DISGUISED = 150,
  NETWORK_ERROR = 1100
}

// イベントハンドラーの型
export type EventHandler = (event?: Event | CustomEvent) => void;
export type ErrorEventHandler = (event: CustomEvent<{code: number}>) => void;
export type StateChangeEventHandler = (event: CustomEvent<PlayerState>) => void;

// プレイヤーインターface
export interface IPlayer {
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number | Promise<number>;
  getDuration(): number | Promise<number>;
  seekTo(time: number): void | Promise<void>;
  setVolume(volume: number): void;
  getVolume(): number | Promise<number>;
  mute(): void;
  unMute(): void;
  isMuted(): boolean | Promise<boolean>;
  getPlayerState(): PlayerState | Promise<PlayerState>;
} 