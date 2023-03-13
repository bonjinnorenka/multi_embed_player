class mep_niconico{
    static playerId = 0;
    static origin = 'https://embed.nicovideo.jp';
    static localStorageCheck = null;
    constructor(replacing_element,content){
        this.state = {
            isRepeat: false,
            playerStatus: 0
        };
        this.messageListener();
        this.startSeconds = 0;
        if(content["playerVars"]["startSeconds"]!=undefined){
            this.startSeconds = content["playerVars"]["startSeconds"];
        }
        let niconico_doc = document.createElement("iframe");
        niconico_doc.src = "https://embed.nicovideo.jp/watch/" + content["videoId"] + "?jsapi=1&playerId=" + String(mep_niconico.playerId) + "&from=" + String(this.startSeconds);
        this.playerId = String(mep_niconico.playerId);
        mep_niconico.playerId++;
        niconico_doc.width = content["width"];
        niconico_doc.height = content["height"];
        niconico_doc.allow = "autoplay";//fix bug not autoplay on chrome
        niconico_doc.allowFullscreen = true;//fix bug can't watch on full screen(all browser)
        niconico_doc.style.border = "none";//fix bug display border on outer frame
        replacing_element.replaceWith(niconico_doc);
        this.player = niconico_doc;
        //this.checkLocalstorage(); 3/1のアプデで不要に
        this.autoplay_flag = false;
        if(content["playerVars"]["autoplay"]==1){//終わり次第再生
            this.autoplay_flag = true;
        }
        this.endSeconds = -1;
        if(content["playerVars"]["endSeconds"]!=undefined){
            this.endSeconds = content["playerVars"]["endSeconds"];
        }
        if(content["playerVars"]["displayComment"]!=undefined){
            if(content["playerVars"]["displayComment"]==0){
                this.displayCommentMode = false;
            }
            else if(content["playerVars"]["displayComment"]==1){
                this.displayCommentMode = true;
            }
        }
    }
    async checkLocalstorage(){
        //check whether cross domain iframe can use local storage
        //if can't ,it will not play niconico embed
        if(mep_niconico.localStorageCheck==null){
            let cdls = document.createElement("iframe");
            cdls.width = "0";
            cdls.height = "0";
            cdls.src = "https://js.ryokuryu.com/multi_embed_player/localStorageCheck.html";//if you don't prefer you can change this file.But you must change origin.If you this embed example.com,you must not this otherdomain.example.com
            cdls.style = "border:none;"
            let origin = "https://js.ryokuryu.com";
            document.body.appendChild(cdls);
            let return_str = await new Promise(function(resolve,reject){
                window.addEventListener("message",function(ms){
                    if(ms.origin==origin){
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
                mep_niconico.localStorageCheck = false;
                this.player.parentElement.dispatchEvent(new Event("onError"))//can't play niconico video
            }
            else{
                mep_niconico.localStorageCheck = true;
            }
        }
        else if(mep_niconico.localStorageCheck==false){
            this.player.parentElement.dispatchEvent(new Event("onError"))//can't play niconico video
            console.log("error")
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
        this.player.src = "https://embed.nicovideo.jp/watch/" + content["videoId"] + "?jsapi=1&playerId=" + String(this.playerId) + "&from=" + String(this.startSeconds);
        this.autoplay_flag = false;
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
        this.player.src = "https://embed.nicovideo.jp/watch/" + content["videoId"] + "?jsapi=1&playerId=" + String(this.playerId) + "&from=" + String(this.startSeconds);
        this.autoplay_flag = true;
    }
    getRealDulation(){//original function
        if(this.endSeconds==-1){
            return this.getDuration() - this.startSeconds;
        }
        else{
            return this.endSeconds - this.startSeconds;
        }
    }
    playVideo(){
        this.postMessage({
            eventName: 'play'
        })
    }
    pauseVideo(){
        this.postMessage({
            eventName: 'pause'
        })
    }
    getCurrentTime(){
        return this.state.currentTime/1000;//msec->sec
    }
    getDuration(){
        return this.state.duration/1000;//msec->sec
    }
    getTitle(){
        return this.state.videoInfo.title;
    }
    isMuted(){
        return this.state.muted;
    }
    getVolume(){
        return Number(this.state.volume)*100;
    }
    seekTo(seconds){
        this.postMessage({
            eventName: 'seek',
            data: {
              time: seconds*1000//secounds->msec
            }
          })
    }
    displayComment(mode){
        this.postMessage({
            eventName: "commentVisibilityChange",
            data:{
                commentVisibility: mode
            }
        })
    }
    mute(){
        this.postMessage({
            eventName: "mute",
            data:{
                mute:true
            }
        })
    }
    unMute(){
        this.postMessage({
            eventName: "mute",
            data:{
                mute:false
            }
        })
    }
    setVolume(volume){
        this.postMessage({
            eventName: "volumeChange",
            data:{
                volume: volume/100
            }
        })
    }
    getPlayerState(){
        if(this.getCurrentTime()>=this.getDuration()-0.5||(this.endSeconds!=-1&&this.getCurrentTime()>=(this.endSeconds-0.5))){//最後まで行った
            return 4
        }
        else{
            return this.state.playerStatus;
        }
    }
    postMessage(request) {
        const message = Object.assign({
            sourceConnectorType: 1,
            playerId: this.playerId
        }, request);
        this.player.contentWindow.postMessage(message, mep_niconico.origin);
    }
    messageListener() {
        window.addEventListener('message', (e) => {
          if (e.origin === mep_niconico.origin && e.data.playerId === this.playerId) {
            const { data } = e.data;
            switch (e.data.eventName) {
                case 'statusChange': {
                    break;
                }
                case 'error':{
                    this.player.dispatchEvent(new Event("onError"));
                    break;
                }
                case 'playerMetadataChange':{
                    break;
                }
                case 'loadComplete':{
                    if(this.autoplay_flag){
                        this.playVideo();
                    }
                    this.player.dispatchEvent(new Event("onReady"));
                    break;
                }
                case 'playerStatusChange':{
                    this.player.dispatchEvent(new Event("onStateChange"));
                    if(this.getCurrentTime()>=this.getDuration()-0.5||(this.endSeconds!=-1&&this.getCurrentTime()>=(this.endSeconds-0.5))){//最後まで行った
                        this.player.dispatchEvent(new Event("onEndVideo"));
                    }
                    break;
                }
                default:
                    console.log(e.data);
            }
            
            this.state = Object.assign({}, this.state, data);
            if(this.endSeconds!=-1&&this.state.currentTime>=this.endSeconds*1000){//終了時間の時自動で停止
                this.pauseVideo();
            }
          }
        });
      }
}