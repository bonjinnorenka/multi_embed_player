class mep_soundcloud{
    static soundcloud_api_loaded = null;
    static soundcloud_api_promise = [];
    static numericRegex = /^[0-9]+$/;
    async #load_soundcloud_api(){
        if(mep_soundcloud.soundcloud_api_loaded === null){
            if(typeof SC!=="object"){
                mep_soundcloud.soundcloud_api_loaded = false;
                const script_document = document.createElement("script");
                script_document.src = "https://w.soundcloud.com/player/api.js";
                script_document.addEventListener("load",()=>{mep_soundcloud.soundcloud_api_loaded = true;mep_soundcloud.soundcloud_api_promise.forEach((func)=>func())});
                document.body.appendChild(script_document);
                await new Promise((resolve,reject)=>mep_soundcloud.soundcloud_api_promise.push(resolve));
            }
            else{
                mep_soundcloud.soundcloud_api_loaded = true;
            }
        }
        else if(mep_soundcloud.soundcloud_api_loaded === false){
            await new Promise((resolve,reject)=>mep_soundcloud.soundcloud_api_promise.push(resolve));
        }
    }
    constructor(replacing_element,content,player_set_event_function){
        this.#load(replacing_element,content,player_set_event_function);
    }
    async #load(replacing_element,content,player_set_event_function){
        this.player = document.createElement("iframe");
        this.player.style.border = "none";
        this.player.allow = "autoplay";
        if(typeof player_set_event_function === "function"){
            player_set_event_function(this.player);
        }
        await this.#load_soundcloud_api();
        let iframe_replace_node = replacing_element;
        if(typeof replacing_element==="string"){
            iframe_replace_node = document.getElementById(replacing_element);
        }
        let url_params = new URLSearchParams();
        let tflist = ["autoplay","hide_related","show_comments","show_user","show_user","show_reposts","visual"];
        this.playerVars = content.playerVars;
        this.player_statusdata = {playing_status:1,currentPosition:0,volume:100};
        this.autoplay = false;
        if(typeof content.playerVars === "object"){
            tflist.forEach(option=>{
                if(typeof content.playerVars[option]==="number"){
                    content.playerVars[option] = content.playerVars[option].toString()
                }
                if(typeof content.playerVars[option] === "undefined"){
                    url_params.set(option,"true");
                }
                else if(content.playerVars[option] === "1" || content.playerVars[option] === "true"){
                    url_params.set(option,"true");
                }
                else if(content.playerVars[option] === "0" || content.playerVars[option] === "false"){
                    url_params.set(option,"false");
                }
                else{
                    url_params.set(option,content.playerVars[option]);
                }
            });
            if(content.playerVars.autoplay == "true" || content.playerVars.autoplay == 1){
                this.autoplay = true;
            }
        }
        else{
            tflist.forEach(option=>{url_params.set(option,"false");});
        }
        if(mep_soundcloud.numericRegex.test(content.videoId)){
            this.player.src = `https://w.soundcloud.com/player/?url=https://api.soundcloud.com/tracks/${content.videoId}&${url_params.toString()}`;
        }
        else{
            this.player.src = `https://w.soundcloud.com/player/?url=https://soundcloud.com/${content.videoId}&${url_params.toString()}`;
        }
        iframe_replace_node.replaceWith(this.player);
        this.player_widget = SC.Widget(this.player);
        this.player_metadata = {};//renew when load new ones
        this.before_mute_volume = 100;
        this.forse_pause = !this.autoplay;
        this.player_widget.bind(SC.Widget.Events.READY,()=>{this.#ready_function()});
        this.player_widget.bind(SC.Widget.Events.PLAY_PROGRESS,(data)=>{this.#tracker(data);this.#tracking_function()});
        this.player_widget.bind(SC.Widget.Events.PLAY,()=>{if(this.first_seek_time!==-1){this.seekTo(this.first_seek_time);this.first_seek_time=-1};this.player_statusdata.playing_status = 2});
        this.player_widget.bind(SC.Widget.Events.PAUSE,()=>{this.player_statusdata.playing_status = 3;this.pause_sended = false;this.forse_pause = true});
        //this.player_widget.bind(SC.Widget.Events.SEEK,()=>this.player_statusdata.playing_status = 3);
        this.player_widget.bind(SC.Widget.Events.FINISH,()=>{this.player.dispatchEvent(new Event("onEndVideo"));this.player_statusdata.playing_status = 4});
        this.player_widget.bind(SC.Widget.Events.ERROR,()=>this.player.dispatchEvent(new Event("onError")));
        this.interval = 0;
        this.previous_player_status = -1;
        if(this.autoplay){
            this.#startTracking();
        }
        this.first_seek_time = (typeof content["playerVars"]["startSeconds"] === "number")?content["playerVars"]["startSeconds"]:-1;
        this.endSeconds = (typeof content["playerVars"]["endSeconds"] === "number")?content["playerVars"]["endSeconds"]:-1;
        this.pause_sended = false;
    }
    #ready_function(retry=false){
        this.player.dispatchEvent(new Event("onReady"));
        this.player_widget.getCurrentSound((data)=>{if(data===null){this.player.dispatchEvent(new Event("onError"))};this.player_metadata = data});
        if(this.autoplay&&!this.forse_pause){
            this.playVideo();
            if(retry&&this.retry_count<7){
                this.retry_count++;
                setTimeout(()=>{this.#ready_function(true)},1000);
            }
        }
    }
    #tracker(trackData){
        this.player_statusdata.currentPosition = trackData.currentPosition;
    }
    #tracking_function(){
        //this.player_widget.getVolume((volume)=>{this.player_statusdata.volume = volume});
        //this.player_widget.isPaused((pause_status)=>{pause_status?this.player_statusdata.playing_status = 3:this.player_statusdata.playing_status = 2});
        if(this.previous_player_status!==this.player_statusdata.playing_status){
            this.previous_player_status = this.player_statusdata.playing_status;
            this.player.dispatchEvent(new Event("onStateChange"));
        }
        if(this.endSeconds!=-1&&this.endSeconds<=this.getCurrentTime()){
            if(!this.pause_sended){
                this.pause_sended = true;
                this.pauseVideo();
                this.player.dispatchEvent(new Event("onEndVideo"));
                this.player_statusdata.playing_status = 4;
            }
        }
    }
    #startTracking(){
        if(this.interval===0){
            //this.interval = setInterval(()=>{this.tracking_function()},1000); 
        }
    }
    #stopTracking(){
        clearInterval(this.interval);
        this.interval = 0;
        this.#tracking_function();
    }
    playVideo(){
        this.#startTracking();
        if(this.first_seek_time!==-1){
            this.seekTo(this.first_seek_time);
            this.first_seek_time = -1;
        }
        this.player_widget.play();
    }
    pauseVideo(){
        this.#stopTracking();
        this.player_widget.pause();
        this.forse_pause = true;
    }
    getCurrentTime(){
        return this.player_statusdata.currentPosition/1000;
    }
    getDuration(){
        return this.player_metadata.duration / 1000;
    }
    seekTo(skipSecounds){
        if(typeof skipSecounds === "number"){
            this.player_widget.seekTo(skipSecounds*1000);
        }
        else{
            console.error("seekTo argument must be number");
        }
    }
    setVolume(volume){
        this.player_widget.setVolume(volume);
        this.player_statusdata.volume = volume;
    }
    mute(){
        this.before_mute_volume = this.player_statusdata.volume;
        this.setVolume(0);
    }
    unMute(){
        this.setVolume(this.before_mute_volume);
    }
    isMuted(){
        return this.player_statusdata.volume===0;
    }
    getVolume(){
        return this.player_statusdata.volume;
    }
    getPlayerState(){
        return this.player_statusdata.playing_status;
    }
    getTitle(){
        return this.player_metadata.title;
    }
    #musicLoader(content,startSeconds,autoplay){
        /*
        let options = {playerVars:this.playerVars};
        if(options.playerVars === undefined){
            options.playerVars = {};
        }
        options.playerVars["autoplay"] = autoplay;
        if(typeof content === "string"){
            options["videoId"] = content;
        }
        else if (typeof content === "object"){
            options["videoId"] = content["videoId"];
            if(typeof startSeconds === "number"){
                options["start"] = startSeconds;
            }
            else if(typeof content["startSeconds"] === "number"){
                options["start"] = content["startSeconds"];
            }
            if(typeof content["endSeconds"] === "number"){
                options["end"] = content["endSeconds"];
            }
        }
        const tmp_replace_element = document.createElement("div");
        tmp_replace_element.replaceWith(this.player);
        this.load(tmp_replace_element,options);
        */
        
        let url_params = {set(op,val){this[op]=val}}
        let tflist = ["hide_related","show_comments","show_user","show_user","show_reposts","visual"];
        if(typeof this.playerVars==="object"){
            tflist.forEach(option=>{
                if(typeof this.playerVars[option] === "string"&&this.playerVars[option] === "true"){
                    url_params.set(option,"true");
                }
                else{
                    url_params.set(option,"false");
                }
            });
        }
        else{
            tflist.forEach(option=>{url_params.set(option,"false");});
        }
        url_params.set("autoplay",autoplay?"true":"false");
        this.autoplay = autoplay;
        let musicId = "";
        if(typeof content === "object"){
            musicId = content.videoId;
            if(typeof content.startSeconds=="number"&&content.startSeconds!==NaN){
                this.first_seek_time = content.startSeconds;
            }
            else{
                this.first_seek_time = -1;
            }
            if(typeof content.endSeconds=="number"&&content.endSeconds!==NaN){
                this.endSeconds = content.endSeconds;
            }
            else{
                this.endSeconds = -1;
            }
        }
        else if(typeof content === "string"){
            musicId = content;
            if(typeof startSeconds === "number" && startSeconds!==NaN){
                this.first_seek_time = startSeconds;
            }
            else{
                this.first_seek_time = -1;
            }
            this.endSeconds = -1;
        }
        else{
            console.error("argument type error");
        }
        if(mep_soundcloud.numericRegex.test(musicId)){
            this.player_widget.load(`https://api.soundcloud.com/tracks/${String(musicId)}`,url_params,this.#ready_function);
        }
        else{
            this.player_widget.load(`https://soundcloud.com/${String(musicId)}`,url_params,this.#ready_function);
        }
        this.retry_count = 0;
        this.forse_pause = false;
        this.#ready_function(true);
    }
    loadVideoById(content,startSeconds){
        this.#musicLoader(content,startSeconds,true);
    }
    cueVideoById(content,startSeconds){
        this.#musicLoader(content,startSeconds,false);
    }
}
