declare var MusicKit: any;

type mep_applemusic_kind = "songs";

interface mep_applemusic_load_object {
    videoId: string;
    startSeconds?: number;
    endSeconds?: number;
    kind?: mep_applemusic_kind;
    storefront?: string;
}

interface mep_applemusic_playerVars {
    autoplay?: number;
    startSeconds?: number;
    endSeconds?: number;
}

interface mep_applemusic_content {
    videoId: string;
    playerVars?: mep_applemusic_playerVars;
    width?: number;
    height?: number;
    kind?: mep_applemusic_kind;
    storefront?: string;
}

interface mep_applemusic_authorization_status {
    configured: boolean;
    isAuthorized: boolean;
    storefrontId?: string;
}

class mep_applemusic{
    static musickit_api_loaded: number = 0;
    static musickit_api_promise: Array<{resolve: () => void,reject: () => void}> = [];
    static configured: boolean = false;
    static developer_token: string = "";
    static token_expires_at: number = 0;
    static default_storefront: string = "jp";
    static musickit_instance: any = null;
    static token_refresh_margin_seconds: number = 300;

    player: HTMLElement = document.createElement("div");
    service: string = "applemusic";
    content: mep_applemusic_content;
    autoplay: boolean = false;
    startSeconds: number = 0;
    endSeconds: number = -1;
    player_status: number = 0;
    queue_ready: boolean = false;
    muted: boolean = false;
    before_mute_volume: number = 100;
    volume: number = 100;
    end_interval: number = 0;
    ready_promise: Promise<void>;

    constructor(replacing_element: string | HTMLElement, content: mep_applemusic_content, player_set_event_function?: (player: HTMLElement) => void){
        this.content = content;
        this.ready_promise = this.#load(replacing_element,content,player_set_event_function);
    }

    static #is_musickit_api_ready(): boolean{
        const musicKit = (window as any).MusicKit;
        return musicKit!==undefined&&typeof musicKit.configure==="function"&&typeof musicKit.getInstance==="function";
    }

    static #finish_musickit_api_load(resolve: () => void): void{
        mep_applemusic.musickit_api_loaded = 2;
        const promise_queue = mep_applemusic.musickit_api_promise;
        mep_applemusic.musickit_api_promise = [];
        promise_queue.forEach((func)=>func.resolve());
        resolve();
    }

    static #fail_musickit_api_load(reject: () => void): void{
        mep_applemusic.musickit_api_loaded = 0;
        const promise_queue = mep_applemusic.musickit_api_promise;
        mep_applemusic.musickit_api_promise = [];
        promise_queue.forEach((func)=>func.reject());
        reject();
    }

    static async #load_musickit_api(): Promise<void>{
        return new Promise<void>((resolve,reject)=>{
            if(mep_applemusic.#is_musickit_api_ready()){
                mep_applemusic.#finish_musickit_api_load(resolve);
                return;
            }
            if(mep_applemusic.musickit_api_loaded===0){
                mep_applemusic.musickit_api_loaded = 1;
                const script_document = document.createElement("script");
                script_document.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
                script_document.async = true;
                const ready = ()=>{
                    if(mep_applemusic.#is_musickit_api_ready()){
                        mep_applemusic.#finish_musickit_api_load(resolve);
                    }
                };
                document.addEventListener("musickitloaded",ready,{once:true});
                script_document.addEventListener("load",ready,{once:true});
                script_document.addEventListener("error",()=>{
                    document.removeEventListener("musickitloaded",ready);
                    mep_applemusic.#fail_musickit_api_load(reject);
                },{once:true});
                document.body.appendChild(script_document);
            }
            else if(mep_applemusic.musickit_api_loaded===1){
                mep_applemusic.musickit_api_promise.push({resolve:resolve,reject:reject});
            }
            else{
                resolve();
            }
        });
    }

    static async #configure(options?: {storefront?: string}): Promise<any>{
        await mep_applemusic.#load_musickit_api();
        const now = Math.floor(Date.now()/1000);
        if(mep_applemusic.configured&&mep_applemusic.musickit_instance&&mep_applemusic.token_expires_at-mep_applemusic.token_refresh_margin_seconds>now){
            return mep_applemusic.musickit_instance;
        }
        const endpoint = (window as any).multi_embed_player?.iframe_api_endpoint || "https://iframe-api-ts.ryokuryu.workers.dev";
        const response = await fetch(`${endpoint}?route=applemusic-token`);
        if(!response.ok){
            throw new Error("failed to fetch Apple Music developer token");
        }
        const data = await response.json();
        if(typeof data.developerToken!=="string"){
            throw new Error("invalid Apple Music developer token response");
        }
        mep_applemusic.developer_token = data.developerToken;
        mep_applemusic.token_expires_at = typeof data.expiresAt==="number"?data.expiresAt:now+3600;
        mep_applemusic.default_storefront = options?.storefront || data.storefront || "jp";
        const configured_music = MusicKit.configure({
            developerToken: mep_applemusic.developer_token,
            app: {
                name: "multi_embed_player",
                build: "3"
            }
        });
        const configured_music_result = configured_music&&typeof configured_music.then==="function"?await configured_music:configured_music;
        mep_applemusic.musickit_instance = configured_music_result&&typeof configured_music_result.authorize==="function"?configured_music_result:MusicKit.getInstance();
        if(!mep_applemusic.musickit_instance){
            throw new Error("failed to configure MusicKit");
        }
        mep_applemusic.configured = true;
        return mep_applemusic.musickit_instance;
    }

    static async authorizeAppleMusic(options?: {storefront?: string}): Promise<mep_applemusic_authorization_status>{
        const music = await mep_applemusic.#configure(options);
        if(!music.isAuthorized){
            await music.authorize();
        }
        return await mep_applemusic.getAuthorizationStatus();
    }

    static async getAuthorizationStatus(): Promise<mep_applemusic_authorization_status>{
        let configured = mep_applemusic.configured;
        let music = mep_applemusic.musickit_instance;
        if(!music){
            try{
                music = await mep_applemusic.#configure();
                configured = true;
            }
            catch{
                return {configured:false,isAuthorized:false};
            }
        }
        const storefrontId = music.storefrontId || music.storefront?.id || mep_applemusic.default_storefront;
        return {configured:configured,isAuthorized:!!music.isAuthorized,storefrontId:storefrontId};
    }

    async #load(replacing_element: string | HTMLElement, content: mep_applemusic_content, player_set_event_function?: (player: HTMLElement) => void): Promise<void>{
        let replacing_node: HTMLElement | null = null;
        if(typeof replacing_element==="string"){
            replacing_node = document.getElementById(replacing_element);
        }
        else{
            replacing_node = replacing_element;
        }
        this.player.classList.add("mep_applemusic_player");
        this.player.style.width = "100%";
        this.player.style.height = "100%";
        this.player.dataset.service = "applemusic";
        if(replacing_node){
            replacing_node.replaceWith(this.player);
        }
        if(typeof player_set_event_function==="function"){
            player_set_event_function(this.player);
        }
        this.content = {
            videoId: content.videoId,
            playerVars: content.playerVars,
            kind: content.kind,
            storefront: content.storefront
        };
        this.startSeconds = content.playerVars?.startSeconds!==undefined?Number(content.playerVars.startSeconds):0;
        this.endSeconds = content.playerVars?.endSeconds!==undefined?Number(content.playerVars.endSeconds):-1;
        this.queue_ready = false;
        this.player_status = 1;
        this.autoplay = content.playerVars?.autoplay===1;
        this.#dispatchEvent(new Event("onReady"));
    }

    #validateContent(content: mep_applemusic_load_object): boolean{
        if(content.kind!==undefined&&content.kind!=="songs"){
            this.#dispatchEvent(new CustomEvent("onError",{detail:{code:401}}));
            return false;
        }
        if(content.storefront!==undefined&&!/^[a-z]{2}$/.test(content.storefront)){
            this.#dispatchEvent(new CustomEvent("onError",{detail:{code:401}}));
            return false;
        }
        return true;
    }

    async #prepareQueue(): Promise<void>{
        if(this.queue_ready){
            return;
        }
        if(!this.#validateContent(this.content)){
            throw new Error("invalid Apple Music content");
        }
        const music = await mep_applemusic.#configure({storefront:this.content.storefront});
        await music.setQueue({song:this.content.videoId});
        this.queue_ready = true;
        this.player_status = 1;
        this.#dispatchEvent(new CustomEvent("onStateChange",{detail:this.getPlayerState()}));
    }

    #startEndTracking(): void{
        this.#clearEndTracking();
        this.end_interval = window.setInterval(()=>{
            if(this.endSeconds!==-1&&this.getCurrentTime()>=this.endSeconds){
                this.pauseVideo();
                this.player_status = 4;
                this.#dispatchEvent(new CustomEvent("onStateChange",{detail:this.getPlayerState()}));
                this.#dispatchEvent(new Event("onEndVideo"));
                this.#clearEndTracking();
            }
        },500);
    }

    #clearEndTracking(): void{
        if(this.end_interval!==0){
            window.clearInterval(this.end_interval);
            this.end_interval = 0;
        }
    }

    async loadVideoById(content: mep_applemusic_load_object): Promise<void>{
        await this.ready_promise;
        this.#clearEndTracking();
        if(!this.#validateContent(content)){
            return;
        }
        this.content = Object.assign({},this.content,content);
        this.startSeconds = content.startSeconds!==undefined?Number(content.startSeconds):0;
        this.endSeconds = content.endSeconds!==undefined?Number(content.endSeconds):-1;
        this.queue_ready = false;
        this.player_status = 1;
        this.#dispatchEvent(new CustomEvent("onStateChange",{detail:this.getPlayerState()}));
    }

    async cueVideoById(content: mep_applemusic_load_object): Promise<void>{
        await this.loadVideoById(content);
    }

    async playVideo(): Promise<void>{
        try{
            await this.ready_promise;
            await this.#prepareQueue();
            const music = await mep_applemusic.#configure({storefront:this.content.storefront});
            if(!music.isAuthorized){
                await music.authorize();
            }
            await music.play();
            if(this.startSeconds>0){
                await this.seekTo(this.startSeconds);
            }
            this.player_status = 2;
            this.#startEndTracking();
            this.#dispatchEvent(new CustomEvent("onStateChange",{detail:this.getPlayerState()}));
        }
        catch{
            this.#dispatchEvent(new CustomEvent("onError",{detail:{code:403}}));
        }
    }

    pauseVideo(): void{
        try{
            const music = mep_applemusic.musickit_instance;
            if(music){
                music.pause();
            }
        }
        catch{}
        this.player_status = 3;
        this.#clearEndTracking();
        this.#dispatchEvent(new CustomEvent("onStateChange",{detail:this.getPlayerState()}));
    }

    async seekTo(seconds: number): Promise<void>{
        seconds = Number(seconds);
        if(isNaN(seconds)||seconds<0){
            seconds = 0;
        }
        const music = mep_applemusic.musickit_instance;
        if(music&&typeof music.seekToTime==="function"){
            await music.seekToTime(seconds);
        }
    }

    setVolume(volume: number): void{
        volume = Number(volume);
        if(isNaN(volume)){
            return;
        }
        volume = Math.max(0,Math.min(100,volume));
        this.volume = volume;
        const music = mep_applemusic.musickit_instance;
        if(music){
            music.volume = volume/100;
        }
    }

    getVolume(): number{
        const music = mep_applemusic.musickit_instance;
        if(music&&typeof music.volume==="number"){
            return Math.round(music.volume*100);
        }
        return this.volume;
    }

    getCurrentTime(): number{
        const music = mep_applemusic.musickit_instance;
        if(music&&typeof music.currentPlaybackTime==="number"){
            return music.currentPlaybackTime;
        }
        return 0;
    }

    getDuration(): number{
        const music = mep_applemusic.musickit_instance;
        const item = music?.nowPlayingItem;
        if(typeof music?.currentPlaybackDuration==="number"){
            return music.currentPlaybackDuration;
        }
        if(typeof item?.durationInMillis==="number"){
            return item.durationInMillis/1000;
        }
        if(typeof item?.attributes?.durationInMillis==="number"){
            return item.attributes.durationInMillis/1000;
        }
        return 0;
    }

    getRealDulation(): number{
        if(this.endSeconds===-1){
            return this.getDuration()-this.startSeconds;
        }
        return this.endSeconds-this.startSeconds;
    }
    getRealDuration(): number{
        return this.getRealDulation();
    }

    getPlayerState(): number{
        return this.player_status;
    }

    isMuted(): boolean{
        return this.muted;
    }

    mute(): void{
        if(!this.muted){
            this.before_mute_volume = this.getVolume();
        }
        this.muted = true;
        this.setVolume(0);
    }

    unMute(): void{
        this.muted = false;
        this.setVolume(this.before_mute_volume);
    }

    getTitle(): string{
        const music = mep_applemusic.musickit_instance;
        return music?.nowPlayingItem?.title || music?.nowPlayingItem?.attributes?.name || "";
    }

    destroy(): void{
        this.#clearEndTracking();
    }

    #dispatchEvent(event: Event): void{
        try{
            this.player.dispatchEvent(event);
        }
        catch(e){
            console.error(e);
        }
    }
}

(window as any).mep_applemusic = mep_applemusic;
