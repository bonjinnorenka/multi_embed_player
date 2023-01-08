class mep_bilibili{
    static localStorageCheck = null;//ニコニコと同じくlocalstorageにアクセスできないと死ぬため
    static mep_extension_bilibili = false;//拡張機能ないとまともに動かん
    static api_origin = "https://bilibili-api-gate.ryokuryu.workers.dev/";//please change this if you use
    static no_extention_error = "you seems not to install mep_extention yet.if it not installed in your device,you can't exac some function(play,pause etc)";
    static before_mute_volume = 100;
    constructor(replacing_element,content){
        this.state = {
            isRepeat: false,
            playerStatus: 0
        };
        let bilibili_doc = document.createElement("iframe");
        replacing_element.replaceWith(bilibili_doc);
        this.player = bilibili_doc;
        if(mep_bilibili.localStorageCheck!=true){
            this.checkLocalstorage();
        }
        //this.messageListener();
        this.startSeconds = 0;
        if(content["playerVars"]["startSeconds"]!=undefined){
            this.startSeconds = content["playerVars"]["startSeconds"];
        }
        this.autoplay_flag = false;
        if(content["playerVars"]["autoplay"]==1){//終わり次第再生
            this.autoplay_flag = true;
        }
        if(content["playerVars"]["displayComment"]!=undefined){
            if(content["playerVars"]["displayComment"]==0){
                this.displayCommentMode = false;
            }
            else if(content["playerVars"]["displayComment"]==1){
                this.displayCommentMode = true;
            }
        }
        let bilibili_query = {};
        bilibili_query["bvid"] = content["videoid"];
        this.videoid = content["videoid"];
        if(this.startSeconds>0){
            bilibili_query["t"] = this.startSeconds;
        }
        if(this.autoplay_flag){
            bilibili_query["autoplay"] = 1;
        }
        if(this.displayCommentMode){
            bilibili_query["danmaku"] = 1;
        }
        else{
            bilibili_query["danmaku"] = 0;
        }
        let query_string = "";
        let bilibili_query_keys = Object.keys(bilibili_query);
        for(let x=0;x<bilibili_query_keys.length;x++){
            query_string += bilibili_query_keys[x] + "=" + String(bilibili_query[bilibili_query_keys[x]]) + "&";
        }
        query_string = query_string.slice(0,-1);
        bilibili_doc.src = "https://player.bilibili.com/player.html?" + query_string;
        bilibili_doc.width = content["width"];
        bilibili_doc.height = content["height"];
        bilibili_doc.allow = "autoplay";//fix bug not autoplay on chrome
        bilibili_doc.allowFullscreen = true;//fix bug can't watch on full screen(all browser)
        bilibili_doc.style.border = "none";//fix bug display border on outer frame
        if(!mep_bilibili.mep_extension_bilibili){//時間カウント用プログラムの追加
            this.player.addEventListener("load",()=>{this.play_start_time = new Date().getTime();this.play_start_count_interval = setInterval(this.observe_load_time.bind(this),500);this.player.dispatchEvent(new Event("onReady"))},{once:true});
        }
        this.endSeconds = -1;
        if(content["playerVars"]["endSeconds"]!=undefined){
            this.endSeconds = content["playerVars"]["endSeconds"];
        }
        if(this.endSeconds!=-1){
            this.end_point_observe = setInterval(this.observe_end_time.bind(this),500);
        }
    }
    async checkLocalstorage(){
        //check whether cross domain iframe can use local storage
        //if can't ,it will not load bilibili embed
        if(mep_bilibili.localStorageCheck==null){
            let cdls = document.createElement("iframe");
            cdls.width = "0";
            cdls.height = "0";
            cdls.src = "https://js.ryokuryu.com/multi_embed_player/localStorageCheck.html";//if you don't prefer you can change this file.But you must change origin.If you this embed example.com,you must not this otherdomain.example.com
            //and if extention exists,it will redirect to send information about exist browser extention
            cdls.style = "border:none;"
            let origin = "https://js.ryokuryu.com";
            document.body.appendChild(cdls);
            let return_str = await new Promise(function(resolve,reject){
                window.addEventListener("message",function(ms){
                    if(ms.origin==origin){
                        try{
                            if(ms.data.extention){
                                mep_bilibili.mep_extension_bilibili = true;
                            }
                        }
                        catch{}
                        if(ms.data.main=="can use localStorage"){
                            resolve("can")
                        }
                        else if(ms.data.main=="error on use localStorage"){
                            resolve("can't")
                        }
                    }
                })
            }.bind(origin));
            if(return_str=="can't"){
                mep_bilibili.localStorageCheck = false;
                this.player.parentElement.dispatchEvent(new Event("onError"))//can't play niconico video
            }
            else{
                mep_bilibili.localStorageCheck = true;
            }
        }
        else if(mep_bilibili.localStorageCheck==false){
            this.player.parentElement.dispatchEvent(new Event("onError"))//can't play niconico video
            console.log("error")
        }
    }
    observe_load_time(){
        let now_time = new Date().getTime();
        this.estimate_time = (now_time - this.play_start_time)/1000 + this.startSeconds -1;//予測秒
        if(this.endSeconds!=-1&&this.estimate_time>this.endSeconds){
            this.custom_state = 4;
            this.player.dispatchEvent(new Event("onEndVideo"));//再生を終了したことにする
            clearInterval(this.play_start_count_interval);//確認を消去
            this.pause();
        }
    }
    async observe_end_time(){
        let current_time = await this.getCurrentTime();
        if(this.endSeconds!=-1&&this.endSeconds<=current_time){//時間が来た
            this.custom_state = 4;
            clearInterval(this.end_point_observe);
            this.pause();
            this.player.dispatchEvent(new Event("onEndVideo"));
        }
        else if(this.endSeconds==-1){
            clearInterval(this.end_point_observe);
        }
    }
    cueVideoById(content){
        this.startSeconds = 0;
        if(content["startSeconds"]!=undefined){
            this.startSeconds = content["startSeconds"];
        }
        this.endSeconds = -1;
        if(content["endSeconds"]!=undefined){
            this.endSeconds = content["endSeconds"];
        }
        this.autoplay_flag = false;
        this.video_loader(content);
    }
    loadVideoById(content){
        this.startSeconds = 0;
        if(content["startSeconds"]!=undefined){
            this.startSeconds = content["startSeconds"];
        }
        this.endSeconds = -1;
        if(content["endSeconds"]!=undefined){
            this.endSeconds = content["endSeconds"];
        }
        this.autoplay_flag = true;
        this.video_loader(content);
    }
    video_loader(content){
        let bilibili_query = {};
        bilibili_query["bvid"] = content["videoid"];
        this.videoid = content["videoid"];
        if(this.startSeconds>0){
            bilibili_query["t"] = this.startSeconds;
        }
        if(this.autoplay_flag){
            bilibili_query["autoplay"] = 1;
        }
        let query_string = "";
        let bilibili_query_keys = Object.keys(bilibili_query);
        for(let x=0;x<bilibili_query_keys.length;x++){
            query_string += bilibili_query_keys[x] + "=" + String(bilibili_query[bilibili_query_keys[x]]) + "&";
        }
        query_string = query_string.slice(0,-1);
        this.player.src = "https://player.bilibili.com/player.html?" + query_string;
        if(this.endSeconds!=-1){
            this.end_point_observe = setInterval(this.observe_end_time.bind(this),500);
        }
    }
    getCurrentTime(){
        if(!mep_bilibili.mep_extension_bilibili){
            return this.estimate_time;
        }
        else{
            this.player.contentWindow.postMessage({eventName:"currentTime"},"*");
            return new Promise((resolve,reject) => {
                window.addEventListener("message",(data)=>{if(data.data.currentTime!=undefined){resolve(data.data.currentTime)}})
            })
        }
    }
    playVideo(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.log(mep_bilibili.no_extention_error);
        }
        else{
            this.player.contentWindow.postMessage({eventName:"play"},"*");
        }
    }
    pauseVideo(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.log(mep_bilibili.no_extention_error);
        }
        else{
            this.player.contentWindow.postMessage({eventName:"pause"},"*");
        }
    }
    seekTo(seektime){
        if(!mep_bilibili.mep_extension_bilibili){
            console.log(mep_bilibili.no_extention_error);
        }
        else{
            this.player.contentWindow.postMessage({eventName:"seek",seekTime:Number(seektime)},"*");
        }
    }
    async getRealDulation(){//original function
        if(this.endSeconds==-1){
            return await this.getDuration() - this.startSeconds;
        }
        else{
            return this.endSeconds - this.startSeconds;
        }
    }

    async getVideodataApi(){
        return new Promise(async(resolve,reject)=>{
            resolve(await(await fetch(mep_bilibili.api_origin + "?videoid=" + this.videoid)).json());
        });
    }

    async getDuration(){
        if(!mep_bilibili.mep_extension_bilibili){
            let videodata_api = await this.getVideodataApi();
            return videodata_api["data"]["duration"];
        }
        else{
            this.player.contentWindow.postMessage({eventName:"dulation"},"*");
            return new Promise((resolve,reject) => {
                window.addEventListener("message",(data)=>{if(data.data.dulation!=undefined){resolve(data.data.dulation)}})
            })
        }
    }

    async getTitle(){
        if(!mep_bilibili.mep_extension_bilibili){
            let videodata_api = await this.getVideodataApi();
            return videodata_api["data"]["title"];
        }
        else{
            this.player.contentWindow.postMessage({eventName:"getTitle"},"*");
            return new Promise((resolve,reject) => {
                window.addEventListener("message",(data)=>{if(data.data.getTitle!=undefined){resolve(data.data.getTitle)}})
            })
        }
    }
    getPlayerState(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.log(mep_bilibili.no_extention_error);
        }
        else{
            this.player.contentWindow.postMessage({eventName:"getPlayerState"},"*");
            return new Promise((resolve,reject) => {
                window.addEventListener("message",async(data)=>{if(data.data.getPlayerState!=undefined){
                    if(data.data.getPlayerState=="READY"){
                        resolve(1)
                    }
                    else if(data.data.getPlayerState=="PLAYING"){
                        resolve(2)
                    }
                    else if(data.data.getPlayerState=="PAUSED"){
                        let current_duration = ((await this.getCurrentTime()) / ((await this.getDuration()) - this.endSeconds))*100//%で出す
                        if(current_duration>98){
                            resolve(4)
                        }
                        else{
                            resolve(3)
                        }
                    }
                }})
            })
        }
    }
    setVolume(volume){
        if(!mep_bilibili.mep_extension_bilibili){
            console.log(mep_bilibili.no_extention_error);
        }
        else{
            this.player.contentWindow.postMessage({eventName:"setVolume",volume:Number(volume/100)},"*");//100で割って差をなくす
        }
    }
    getVolume(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.log(mep_bilibili.no_extention_error);
        }
        else{
            this.player.contentWindow.postMessage({eventName:"volumeValue"},"*");
            return new Promise((resolve,reject) => {
                window.addEventListener("message",(data)=>{if(data.data.volumeValue!=undefined){resolve(Number(data.data.volumeValue)*100)}})
            })
        }
    }
    async isMuted(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.log(mep_bilibili.no_extention_error);
        }
        else{
            if(await this.getVolume()!=0){
                return false
            }
            else{
                return true
            }
        }
    }
    async mute(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.log(mep_bilibili.no_extention_error);
        }
        else{
            mep_bilibili.before_mute_volume = await this.getVolume();
            this.setVolume(0);
        }
    }
    unMute(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.log(mep_bilibili.no_extention_error);
        }
        else{
            this.setVolume(mep_bilibili.before_mute_volume);
        }
    }
    displayComment(mode){
        this.player.contentWindow.postMessage({eventName:"displayComment",commentVisibility:mode},"*");
    }
}