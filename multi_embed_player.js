class multi_embed_player extends HTMLElement{
    static script_origin = "https://cdn.jsdelivr.net/gh/bonjinnorenka/multi_embed_player@latest/";
    //static script_origin = "https://js.ryokuryu.com/";
    //static script_origin = "http://localhost:5500/";
    static niconicoapi = "https://niconico-imager.ryokuryu.workers.dev/";
    static bilibiliapi = "https://bilibili-api-gate.ryokuryu.workers.dev/";
    static mep_status_load_youtube_api = false;
    static mep_status_load_niconico_api = false;
    static mep_status_load_bilibili_api = false;
    static bilibili_api_cache = {};
    constructor(){
        super();
        this.videoid = null;
    }
    async connectedCallback(){
        if(this.getAttribute("type")===null||this.getAttribute("type")==="embed"||this.getAttribute("type")==="thumbnail-click"){
            this.videoid = this.getAttribute("videoid");
            this.service = this.getAttribute("service");
            //画像取得
            if(this.getAttribute("img_url")!=null){
                this.image_url = this.getAttribute("img_url");
            }
            else if(this.getAttribute("picture_tag")!=null){//pictureタグの中身を入れる
                this.picture_tag = document.createElement("picture");
                this.appendChild(this.picture_tag);
                this.picture_tag.innerHTML = this.getAttribute("picture_tag");
            }
            else{
                this.image_url = await this.mep_imageurl(this.videoid,this.service);
            }
            if(this.image_url!=undefined){
                this.style.backgroundImage = 'url(' + this.image_url + ')';
            }
            //this.style.backgroundImage = this.image_url;
            if (!this.style.backgroundImage) {
                //this.style.backgroundImage = 'url(' + this.image_url + ')';
            }
            //status setting
            if(this.getAttribute("type")===null||this.getAttribute("type")==="embed"){
                this.addEventListener('click', this.add_iframe,{once:true});
            }
            if(this.getAttribute("type")==="thumbnail-click"){
                this.addEventListener('click',function(){this.PlayOnPlayer(this.getAttribute("for"),this.getAttribute("service"),this.getAttribute("videoid"),this.getAttribute("start"),this.getAttribute("end"),this.getAttribute("subService"),this.getAttribute("subVideoid"))}.bind(this));
                this.addEventListener('contextmenu',function(e){e.preventDefault();this.addPlaylist()}.bind(this));
            }
        }
        else if(this.getAttribute("type")==="player"){
            this.player = {};
            this.player.service = "before embed";
            this.playlist = [];
            this.addEventListener("onEndVideo",function(){if(this.playlist.length>0){this.loadVideoById(this.playlist.shift())}});//終わりが来たとき次のやつを再生
            this.addEventListener("addPlaylist",function(){if(this.getPlayerState()==4){if(this.playlist.length>0){this.loadVideoById(this.playlist.shift())}}}.bind(this));
        }
    }
    async add_iframe(e=null,sub=false){
        this.error_not_declare = false;
        if(this.getAttribute("subService")!=null&&this.getAttribute("subVideoid")!=null){
            this.error_not_declare = true;
        }
        if(sub==true){
            if(this.getAttribute("subService")!=null&&this.getAttribute("subVideoid")!=null){
                this.innerHTML = "";//reset
                this.service = this.getAttribute("subService");
                this.videoid = this.getAttribute("subVideoid");
            }
            else{
                return//放置
            }
        }
        else{
            this.addEventListener("executeSecound",function(){this.add_iframe(null,true)}.bind(this),{once:true});
        }
        this.startSeconds = 0;
        if(this.getAttribute("start")!=null){
            this.startSeconds = Number(this.getAttribute("start"));
        }
        this.endSeconds = -1;
        if(this.getAttribute("end")!=null){
            this.endSeconds = Number(this.getAttribute("end"));
        }
        if(this.service=="youtube"){
            await this.youtube_api_loader();//api読み込み待機
            //作成
            let divdoc = document.createElement("div");
            divdoc.classList.add("mep_youtube");
            this.append(divdoc);
            this.player = new YT.Player(divdoc, {
                height: '315',
                width: '560',
                videoId: this.videoid,
                //playerVars: { 'autoplay': 1, 'controls': 0 },
                playerVars: { 'autoplay': 1},
                host: 'https://www.youtube-nocookie.com',
            });
            this.player.service = "youtube";
            this.setEvent();
            if(this.getAttribute("start")!=null||this.getAttribute("end")!=null){//再生時間指定がある場合は残念ながら強制再読み込み
                let data = {"service":"youtube","videoId":this.videoid};
                if(this.getAttribute("start")!=null){
                    data["startSeconds"] = this.getAttribute("start");
                }
                if(this.getAttribute("end")!=null){
                    data["endSeconds"] = this.getAttribute("end");
                }
                this.player.addEventListener("onReady",function(){this.player.loadVideoById(data);}.bind(this,data),{once: true});
            }
        }
        else if(this.service=="niconico"){
            //自家製api読み込み
            await this.niconico_api_loader();
            let divdoc = document.createElement("div");
            divdoc.classList.add("mep_niconico");
            this.append(divdoc);
            let playerVars = {"autoplay":1}
            if(this.startSeconds!=0){
                playerVars["startSeconds"] = this.startSeconds;
            }
            if(this.endSeconds!=-1){
                playerVars["endSeconds"] = this.endSeconds;
            }
            this.player = new mep_niconico(divdoc,{
                "videoId":this.videoid,
                "width":"560",
                "height":"315",
                "playerVars":playerVars
            });
            this.setEvent();
            this.player.service = "niconico";
        }
        else if(this.service=="bilibili"){
            //自家製api読み込み
            await this.bilibili_api_loader();
            let divdoc = document.createElement("div");
            divdoc.classList.add("mep_bilibili");
            this.append(divdoc);
            let playerVars = {"autoplay":1}
            if(this.startSeconds!=0){
                playerVars["startSeconds"] = this.startSeconds;
            }
            if(this.endSeconds!=-1){
                playerVars["endSeconds"] = this.endSeconds;
            }
            this.player = new mep_bilibili(divdoc,{
                "videoId":this.videoid,
                "width":"560",
                "height":"315",
                "playerVars":playerVars
            });
            this.setEvent();
            this.player.service = "bilibili";
        }
    }
    async mep_imageurl(videoid,service,filetype=null){//必ずawaitを使って叩くこと
        let image_url = "";
        if(service=="youtube"){//yourubeの時
            if(filetype=="jpg"){
                image_url = "https://i.ytimg.com/vi/" + videoid + "/hqdefault.jpg";
            }
            else{//recommend
                image_url = "https://i.ytimg.com/vi_webp/" + videoid + "/hqdefault.webp";
            }
            return image_url
        }
        else if(service=="niconico"){
            //fetchでcloudflare workersに置いたapiを叩き取得 各自用意してほしい
            //jpgしかない
            let a = await fetch(multi_embed_player.niconicoapi + "?videoid=" + videoid);
            let json_a = await a.json();
            image_url = json_a["image"];
            return image_url
        }
        else if(service=="bilibili"){
            //fetchでcloudflare workersに置いたapiを叩き取得 各自用意してほしい
            let a = await fetch(multi_embed_player.bilibiliapi + "?bvid=" + videoid+"&image_base64=1");
            let json_a = await a.json();
            //image_url = json_a["data"]["pic"]
            image_url = json_a["image_base64"];
            delete json_a["image_base64"];//キャッシュの軽量化 大体200kbぐらい
            multi_embed_player.bilibili_api_cache[videoid] = json_a;
            return image_url
        }
        else{
            image_url = "invalid_url";
            return image_url
        }
        
    }
    async loadVideoById(data,autoplay=true,sub=false){
        if(this.player!=undefined){
            let service_changed = false;
            this.error_not_declare = false;
            if(sub==false){//1回目
                this.previousData = data;
                if(typeof data.subVideoId==="string"&&typeof data.subService==="string"){
                    this.error_not_declare = true;
                    this.addEventListener("executeSecound",function(){this.loadVideoById(null,true,true)}.bind(this),{once:true});   
                }
                if(data.service!=this.player.service){
                    this.deleteEvent();
                    service_changed = true;
                    this.service = data.service;
                }
                this.videoid = data.videoId;
            }
            else if(sub==true){
                data = this.previousData;
                this.deleteEvent();
                service_changed = true;
                this.videoid = data.subVideoId;
                this.service = data.subService;
            }
            this.startSeconds = 0;
            if(data.startSeconds!=undefined){
                this.startSeconds = Number(data.startSeconds);
            }
            this.endSeconds = -1;
            if(data.endSeconds!=undefined){
                this.endSeconds = Number(data.endSeconds);
            }
            this.setAttribute("videoid",data.videoId);//いらないけど勘違い防止用に
            this.setAttribute("service",data.service);
            if(this.service=="youtube"){
                await this.youtube_api_loader();
                if(service_changed==false){
                    if(autoplay){
                        this.player.loadVideoById(data);
                    }
                    else{
                        this.player.cueVideoById(data);
                    }
                }
                else{
                    //中を消して新たに作成
                    this.innerHTML = "";
                    let divdoc = document.createElement("div");
                    divdoc.classList.add("mep_youtube");
                    this.appendChild(divdoc);
                    //let playerVars = {'controls': 0 }
                    let playerVars = {}
                    if(autoplay){
                        playerVars.autoplay = 1;
                    }
                    if(data["startSeconds"]!=undefined){
                        playerVars.startSeconds = data["startSeconds"];
                    }
                    if(data["endSeconds"]!=undefined){
                        playerVars.endSeconds = data["endSeconds"];
                    }
                    this.player = new YT.Player(divdoc, {
                        height: '315',
                        width: '560',
                        videoId: this.videoid,
                        playerVars: playerVars,
                        host: 'https://www.youtube-nocookie.com',
                    });
                    if(autoplay==false){
                        this.player.addEventListener("onReady",function(){this.player.stopVideo()},{once: true});
                    }
                    this.setEvent();
                    if(data["startSeconds"]!=undefined||data["endSeconds"]!=undefined){//再生時間指定がある場合は残念ながら強制再読み込み
                        if(sub==false){
                            this.player.addEventListener("onReady",function(){this.player.loadVideoById(data);}.bind(this,data),{once: true});
                        }
                        else{
                            this.player.addEventListener("onReady",function(){let datas=data;datas.videoId=datas.subVideoId;this.player.loadVideoById(datas);}.bind(this,data),{once: true});
                        }
                    }
                    this.player.service = "youtube";
                }
            }
            else if(this.service=="niconico"){
                await this.niconico_api_loader();
                if(service_changed==false){
                    //動画idを変えてiframeを再読み込み
                    if(autoplay){
                        this.player.loadVideoById(data);
                    }
                    else{
                        this.player.cueVideoById(data);
                    }
                }
                else{
                    this.innerHTML = "";
                    let divdoc = document.createElement("div");
                    divdoc.classList.add("mep_niconico");
                    this.appendChild(divdoc);
                    let playerVars = {};
                    if(autoplay){
                        playerVars.autoplay = 1;
                    }
                    if(data["startSeconds"]!=undefined){
                        playerVars.startSeconds = data["startSeconds"];
                    }
                    if(data["endSeconds"]!=undefined){
                        playerVars.endSeconds = data["endSeconds"];
                    }
                    this.player = new mep_niconico(divdoc,{
                        "videoId":this.videoid,
                        "width":"560",
                        "height":"315",
                        "playerVars":playerVars
                    });
                    this.setEvent();
                    this.player.service = "niconico";
                }
            }
            else if(this.service=="bilibili"){
                await this.bilibili_api_loader();
                if(service_changed==false){
                    //動画idを変えてiframeを再読み込み
                    if(autoplay){
                        this.player.loadVideoById(data);
                    }
                    else{
                        this.player.cueVideoById(data);
                    }
                }
                else{
                    this.innerHTML = "";
                    let divdoc = document.createElement("div");
                    divdoc.classList.add("mep_bilibili");
                    this.append(divdoc);
                    let playerVars = {}
                    if(autoplay){
                        playerVars["autoplay"] = 1;
                    }
                    if(this.startSeconds!=0){
                        playerVars["startSeconds"] = this.startSeconds;
                    }
                    if(this.endSeconds!=-1){
                        playerVars["endSeconds"] = this.endSeconds;
                    }
                    this.player = new mep_bilibili(divdoc,{
                        "videoId":this.videoid,
                        "width":"560",
                        "height":"315",
                        "playerVars":playerVars
                    });
                    this.setEvent();
                    this.player.service = "bilibili";
                }
            }
        }
        else{
            console.log("player not found.");
        }
    }
    setEvent(){
        try{
            if(this.service=="youtube"){
                this.player.addEventListener("onReady",function(){this.dispatchEvent(new Event("onReady"))}.bind(this));//need bind
                this.player.addEventListener("onError",function(){if(!this.error_not_declare){this.dispatchEvent(new Event("onError"))}else{this.dispatchEvent(new Event("executeSecound"))}}.bind(this));
                this.player.addEventListener("onStateChange",function(){this.dispatchEvent(new Event("onStateChange"))}.bind(this));
                this.player.addEventListener("onStateChange",function(){if(this.getCurrentTime()>this.getDuration()-1||(this.endSeconds!=-1&&this.getCurrentTime()!=0&&this.endSeconds-1<=this.getCurrentTime())){this.dispatchEvent(new Event("onEndVideo"))}}.bind(this))
            }
            else if(this.service=="niconico"||this.service=="bilibili"){
                this.player.player.addEventListener("onReady",function(){this.dispatchEvent(new Event("onReady"))}.bind(this));//need bind
                this.player.player.addEventListener("onError",function(){if(!this.error_not_declare){this.dispatchEvent(new Event("onError"))}else{this.dispatchEvent(new Event("executeSecound"))}}.bind(this));
                this.player.player.addEventListener("onStateChange",function(){this.dispatchEvent(new Event("onStateChange"))}.bind(this));
                this.player.player.addEventListener("onEndVideo",function(){this.dispatchEvent(new Event("onEndVideo"))}.bind(this));
            }
        }
        catch{}
    }
    deleteEvent(){//plese before change service
        try{
            if(this.service=="youtube"){
                this.player.removeEventListener("onReady",function(){this.dispatchEvent(new Event("onReady"))}.bind(this));//need bind
                this.player.removeEventListener("onError",function(){if(!this.error_not_declare){this.dispatchEvent(new Event("onError"))}else{this.dispatchEvent(new Event("executeSecound"))}}.bind(this));
                this.player.removeEventListener("onStateChange",function(){this.dispatchEvent(new Event("onStateChange"))}.bind(this));
                this.player.removeEventListener("onStateChange",function(){if(this.getCurrentTime()>this.getDuration()-1||(this.endSeconds!=-1&&this.endSeconds-1<=this.getCurrentTime())){this.dispatchEvent(new Event("onEndVideo"))}}.bind(this))
            }
            else if(this.service=="niconico"||this.service=="bilibili"){
                this.player.player.removeEventListener("onReady",function(){this.dispatchEvent(new Event("onReady"))}.bind(this));//need bind
                this.player.player.removeEventListener("onError",function(){if(!this.error_not_declare){this.dispatchEvent(new Event("onError"))}else{this.dispatchEvent(new Event("executeSecound"))}}.bind(this));
                this.player.player.removeEventListener("onStateChange",function(){this.dispatchEvent(new Event("onStateChange"))}.bind(this));
                this.player.player.removeEventListener("onEndVideo",function(){this.dispatchEvent(new Event("onEndVideo"))}.bind(this));
            }
        }
        catch{}
    }
    playVideo(){
        this.player.playVideo();
    }
    stopVideo(){
        this.player.pauseVideo();
    }
    async getCurrentTime(){
        if(this.service=="bilibili"){
            return await this.player.getCurrentTime();
        }
        else{
            return this.player.getCurrentTime();
        }
    }
    async seekTo(seconds){
        await this.player.seekTo(seconds);
    }
    mute(){
        this.player.mute();
    }
    unMute(){
        this.player.unMute();
    }
    isMuted(){
        return this.player.isMuted();
    }
    setVolume(volume){
        this.player.setVolume(Number(volume));
    }
    getVolume(){
        return this.player.getVolume();
    }
    getDuration(){
        return this.player.getDuration();
    }
    getRealDulation(){
        if(this.service=="youtube"){
            if(this.endSeconds==-1){
                return this.getDuration() - this.startSeconds;
            }
            else{
                return this.endSeconds - this.startSeconds;
            }
        }
        else if(this.service=="niconico"||this.service=="bilibili"){
            return this.player.getRealDulation();
        }
        else{
            return 0;
        }
    }
    async getRelativeCurrentTime(){
        return await this.getCurrentTime() - this.startSeconds;
    }
    getPercentOfDulation(){//notice sometimes over 100%
        return (this.getRelativeCurrentTime()/this.getRealDulation())*100
    }
    relativeSeekTo_ct(seconds){//current time + seek time
        this.seekTo(seconds + this.getCurrentTime());
    }
    relativeSeekTo_ss(seconds){//startSeconds + seek time
        this.seekTo(seconds + this.startSeconds);
    }
    getPlayerState(){
        /*0->not played only thumnail
        1->onload
        2->playing
        3->pause
        4->video ended
        */
        if(this.service=="niconico"||this.service=="bilibili"){
            return this.player.getPlayerState();
        }
        else if(this.service=="youtube"){
            let nowstatus = this.player.getPlayerState();
            if(this.getCurrentTime()>this.getDuration()-1||(this.endSeconds!=-1&&this.endSeconds-1<=this.getCurrentTime())){
                return 4
            }
            else if(nowstatus==-1){
                return 0
            }
            else if(nowstatus==0){
                return 4
            }
            else if(nowstatus==1){
                return 2
            }
            else if(nowstatus==2){
                return 3
            }
            else if(nowstatus==3||nowstatus==5){
                return 1
            }
        }
        else{
            return 4
        }
    }
    PlayOnPlayer(playerid,service,videoid,start,end,subService,subVideoid){
        let playdoc = document.getElementById(playerid);
        let content = new mep_playitem(service,videoid);
        if(start!=null){
            content.startSeconds = start;
        }
        if(end!=null){
            content.endSeconds = end;
        }
        if(subService!=null&&subVideoid!=null){
            content.subVideoid = subVideoid;
            content.subService = subService;
        }
        playdoc.loadVideoById(content.toData());
    }
    async youtube_api_loader(){
        return new Promise(async function(resolve,reject){
            if(multi_embed_player.mep_status_load_youtube_api===false){
                /*
                let a = await fetch(multi_embed_player.script_origin + "multi_embed_player/version.json");
                let version_info = await a.json();
                a = null;
                //api読み込み
                let script_url = "https://www.youtube-nocookie.com/s/player/" + version_info["youtube-iframe-api-version"] + "/www-widgetapi.vflset/www-widgetapi.js";
                //読み込みを待機
                */
                let script_url = "https://www.youtube.com/iframe_api";
                await this.mep_promise_script_loader(script_url);
                multi_embed_player.mep_status_load_youtube_api = true
                YT.ready(resolve);
                //resolve();
            }
            else{
                resolve();
            }
        }.bind(this))
    }
    async niconico_api_loader(){
        return new Promise(async function(resolve,reject){
            if(multi_embed_player.mep_status_load_niconico_api===false){
                //await this.mep_promise_script_loader(multi_embed_player.script_origin + "multi_embed_player/niconico_embed/v1.0/niconico-api.js");
                await this.mep_promise_script_loader(multi_embed_player.script_origin + "niconico_embed/niconico-api.js");
                multi_embed_player.mep_status_load_niconico_api = true;
                resolve();
            }
            else{
                resolve();
            }
        }.bind(this))
    }
    async bilibili_api_loader(){
        return new Promise(async function(resolve,reject){
            if(multi_embed_player.mep_status_load_bilibili_api===false){
                await this.mep_promise_script_loader(multi_embed_player.script_origin + "bilibili_embed/bilibili-api.js");
                multi_embed_player.mep_status_load_bilibili_api = true;
                resolve();
            }
            else{
                resolve();
            }
        }.bind(this))
    }
    async mep_promise_script_loader(src){
        return new Promise(function(resolve,reject){
            let script_document = document.createElement("script");
            script_document.src = src;
            script_document.async = true;
            document.body.appendChild(script_document);
            script_document.addEventListener("load",function(){
                resolve();
            },{once:true});
            script_document.addEventListener("error",function(){
                reject();
            },{once:true});
        })
    }
    addPlaylist(){
        let k_data = new mep_playitem(this.getAttribute("service"),this.getAttribute("videoid"));
        if(this.getAttribute("start")!=null){
            k_data.startSeconds = this.getAttribute("start");
        }
        if(this.getAttribute("end")!=null){
            k_data.endSeconds = this.getAttribute("end");
        }
        if(this.getAttribute("subService")!=null&&this.getAttribute("subVideoid")!=null){
            k_data.subService = this.getAttribute("subService");
            k_data.subVideoid = this.getAttribute("subVideoid");
        }
        document.getElementById(this.getAttribute("for")).playlist.push(k_data.toData());
        document.getElementById(this.getAttribute("for")).dispatchEvent(new Event("addPlaylist"));
    }
}
class mep_playitem{
    constructor(service,videoid){
        this.service = service;
        this.videoid = videoid;
    }
    toData(){
        let content = {"service":this.service,"videoId":this.videoid};
        if(this.startSeconds!=undefined){
            content["startSeconds"] = this.startSeconds;
        }
        if(this.endSeconds!=undefined){
            content["endSeconds"] = this.endSeconds;
        }
        if(this.subService!=undefined&&this.subVideoid!=undefined){
            content["subService"] = this.subService;
            content["subVideoId"] = this.subVideoid;
        }
        return content
    }
}
customElements.define('multi-embed-player', multi_embed_player);//htmlelement 定義