class mep_bilibili{
    static localStorageCheck = null;//ニコニコと同じくlocalstorageにアクセスできないと死ぬため
    static mep_extension_bilibili = false;//拡張機能ないとまともに動かん
    static api_endpoint = "https://iframe_api.ryokuryu.workers.dev";//please change this if you use
    static no_extention_error = "you seems not to install mep_extention yet.if it not installed in your browser,you can't exac some function(mute unMute setVolume etc) and some function(getDulation,getPlayerState etc) will return incorrect data which is not reflect real data";
    static player_base_url = "";//"https://www.bilibili.com/blackboard/webplayer/embed-old.html?"
    static bilibili_api_cache = {};
    static cors_proxy = "";
    constructor(replacing_element,content,player_set_event_function){
        if(mep_bilibili.player_base_url==""){
            const ua = navigator.userAgent;
            if(ua.indexOf("Firefox")!=-1||ua.indexOf("Edg")!=-1){
                mep_bilibili.player_base_url = "https://www.bilibili.com/blackboard/webplayer/embed-old.html?";//fast
            }
            else{
                mep_bilibili.player_base_url = "https://player.bilibili.com/player.html?";//load often lazy in japan but this can mute auto play
            }
        }
        (async()=>{
            await this.#element_constructor(replacing_element,content,player_set_event_function);
        })();
    }
    async #image_player(){
        let exist_img_children = false;
        this.player.parentElement.childNodes.forEach((node)=>{if(node.nodeName==="IMG"){exist_img_children = true}if(node.nodeName==="DIV"&&node.classList.contains("mep_bilibili_transparent")){node.remove()}});
        if(!exist_img_children&&this.play_control_wrap){
            const img_element = document.createElement("img");
            img_element.src = (await this.#getVideodataApi())["image_base64"];
            img_element.width = this.player.width;
            img_element.height = this.player.height;
            img_element.style.width = "100%";
            img_element.style.height = "100%";
            img_element.style.objectFit = "cover";
            img_element.style.cursor = "pointer";
            img_element.addEventListener("click",()=>{this.playVideo()});
            this.player.parentElement.prepend(img_element);
        }
        this.player.hidden = true;
        this.player.src = "";
    }
    #set_pause_transparent(){
        let exist_div_children = false;
        this.player.parentElement.childNodes.forEach((node)=>{if(node.nodeName==="DIV"&&node.classList.contains("mep_bilibili_transparent")){exist_div_children = true}});
        if(!exist_div_children&&this.play_control_wrap){
            const div_element = document.createElement("div");
            div_element.classList.add("mep_bilibili_transparent");
            div_element.style.width = "100%";
            div_element.style.height = "100%";
            div_element.style.zIndex = "1";
            div_element.style.position = "absolute";
            div_element.style.cursor = "pointer";
            div_element.addEventListener("click",()=>{this.pauseVideo()});
            this.player.parentElement.prepend(div_element);
        }
    }
    #add_loading_animation(){
        //https://qiita.com/yoshio-the-end/items/8cec41bad0e817928893
        let exist_mep_load_animation = false;
        Array.from(document.head.getElementsByClassName("mep_load_animation")).forEach((element)=>{if(element.nodeName==="STYLE"){exist_mep_load_animation = true}});
        if(!exist_mep_load_animation){
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
        this.player.classList.add("mep_loading_animation");
    }
    #remove_loading_animation(){
        this.player.classList.remove("mep_loading_animation");
    }
    #add_error_description(){
        const error_description_document = document.createElement("div");
        error_description_document.style.width = "100%";
        error_description_document.style.height = "100%";
        error_description_document.innerText = "Unknown erorr occured";
        this.player.replaceWith(error_description_document);
        this.player = error_description_document;
    }
    #add_player_css_style(){
        let exist_mep_bilibili_player_css = false;
        Array.from(document.head.getElementsByClassName("mep_bilibili_player_css")).forEach((element)=>{if(element.nodeName==="STYLE"){exist_mep_bilibili_player_css = true}});
        if(!exist_mep_bilibili_player_css){
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
    async #element_constructor(replacing_element,content,player_set_event_function){
        this.original_replacing_element = replacing_element;
        this.before_mute_volume = 100;
        this.content_width = content.width;
        this.content_height = content.height;
        if(typeof content?.play_control_wrap === "boolean"){
            this.play_control_wrap = content.play_control_wrap;
        }
        else{
            this.play_control_wrap = true;
        }
        this.videoid = content["videoId"];
        if(typeof replacing_element === "string"){
            replacing_element = document.getElementById(replacing_element);
        }
        let bilibili_doc = document.createElement("iframe");
        replacing_element.replaceWith(bilibili_doc);
        this.player = bilibili_doc;
        this.#add_loading_animation();
        this.player.addEventListener("onReady",()=>{this.#remove_loading_animation()},{once:true});
        this.player.addEventListener("onError",()=>{this.#remove_loading_animation();this.#add_error_description()},{once:true});
        if(typeof player_set_event_function == "function"){
            player_set_event_function(this.player);
        }
        if((await this.#getVideodataApi())["code"]!=0){//video can play or not if code not 0 such as 69002 the video maybe delete.
            this.player.dispatchEvent(new Event("onError"));
            return;
        }
        this.seek_time = -1;
        this.seek_time_used = true;
        this.noextention_count_stop = 0;
        if(content["videoId"]==undefined){
            console.log("videoId = undefined is not valid")
        }
        this.state = {
            getPlayerState: "PAUSE"
        };
        this.apicache = {};
        if(mep_bilibili.localStorageCheck!=true){
            await this.#checkLocalstorage();
        }
        if(mep_bilibili.localStorageCheck===false){
            const error_description_document = document.createElement("div");
            error_description_document.style.width = "100%";
            error_description_document.style.height = "100%";
            error_description_document.innerText = "Due to not to access localstorage,can't play bilibili video\nyou should turn on third party cookie for this site and then reload this page";
            this.player.replaceWith(error_description_document);
            this.player = error_description_document;
            return;
        }
        this.no_extention_pause = false;
        this.#messageListener();
        this.startSeconds = 0;
        this.innerStartSeconds = 0;
        if(content?.playerVars?.startSeconds!=undefined){
            this.startSeconds = content?.playerVars?.startSeconds;
            this.innerStartSeconds = parseInt(content?.playerVars?.startSeconds);
        }
        this.autoplay_flag = false;
        if(content?.playerVars?.autoplay==1){//終わり次第再生
            this.autoplay_flag = true;
        }
        if(content?.playerVars?.displayComment!=undefined){
            if(content?.playerVars?.displayComment==0){
                this.displayCommentMode = false;
            }
            else if(content?.playerVars?.displayComment==1){
                this.displayCommentMode = true;
            }
            else{
                this.displayCommentMode = false;
            }
        }
        let bilibili_query = {};
        if(content["videoId"]==undefined){
            console.log("invalid videoid:" + content["videoId"] + "so stop loading");
            return
        }
        bilibili_query["bvid"] = content["videoId"];
        if(this.startSeconds>0){
            bilibili_query["t"] = this.startSeconds;
        }
        if(this.autoplay_flag){
            bilibili_query["autoplay"] = 1;
        }
        else{
            bilibili_query["autoplay"] = 0;
        }
        if(!this.autoplay_flag&&!mep_bilibili.mep_extension_bilibili){
            this.no_extention_pause = true;
        }
        if(this.displayCommentMode){
            bilibili_query["danmaku"] = 1;
        }
        else{
            bilibili_query["danmaku"] = 0;
        }
        this.fastload = false;
        if(content?.playerVars?.fastLoad!=undefined){
            if(!mep_bilibili.mep_extension_bilibili){
                console.log("fast load ignored because of mep extention not installed in your browser")
            }
            else{
                if(content?.playerVars?.fastLoad==1){
                    this.fastload = true;
                }
            }
        }
        let query_string = "";
        let bilibili_query_keys = Object.keys(bilibili_query);
        for(let x=0;x<bilibili_query_keys.length;x++){
            query_string += bilibili_query_keys[x] + "=" + String(bilibili_query[bilibili_query_keys[x]]) + "&";
        }
        query_string = query_string.slice(0,-1);
        if(this.autoplay_flag){
            if(!mep_bilibili.mep_extension_bilibili){//時間カウント用プログラムの追加
                this.no_extention_estimate_stop = true;
                this.#set_pause_transparent();
                this.player.addEventListener("load",()=>{this.play_start_time = new Date().getTime();this.no_extention_estimate_stop = false;this.play_start_count_interval = setInterval(this.#observe_load_time.bind(this),500);this.player.dispatchEvent(new Event("onReady"))},{once:true});
            }
            else{
                this.player.addEventListener("onReady",()=>{if(this.fastload&&this.startSeconds!=0){this.seekTo(this.startSeconds)};if(this.fastload&&this.autoplay_flag){this.playVideo()}})
            }
        }
        if(this.autoplay_flag||mep_bilibili.mep_extension_bilibili===true){
            bilibili_doc.src = mep_bilibili.player_base_url + query_string;
        }
        else{
            this.#image_player();
        }
        this.#add_player_css_style();
        bilibili_doc.classList.add("mep_bilibili_player");
        bilibili_doc.width = parseInt(content.width);
        bilibili_doc.height = parseInt(content.height);
        bilibili_doc.allow = "autoplay";//fix bug not autoplay on chrome
        bilibili_doc.allowFullscreen = true;//fix bug can't watch on full screen(all browser)
        bilibili_doc.style.border = "none";//fix bug display border on outer frame
        try{bilibili_doc.parentElement.setEvent()}catch{}
        //bilibili_doc.sandbox = "allow-scripts";
        this.endSeconds = -1;
        if(content?.playerVars?.endSeconds!=undefined){
            this.endSeconds = content?.playerVars?.endSeconds;
        }
        if(this.endSeconds!=-1){
            this.end_point_observe = setInterval(this.#observe_end_time.bind(this),500);
        }
    }
    async #checkLocalstorage(){
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
            cdls.remove();
            if(return_str=="can't"){
                mep_bilibili.localStorageCheck = false;
                this.player.parentElement.dispatchEvent(new Event("onError"))//can't play bilibili video
            }
            else{
                mep_bilibili.localStorageCheck = true;
            }
        }
        else if(mep_bilibili.localStorageCheck==false){
            this.player.parentElement.dispatchEvent(new Event("onError"))//can't play bilibili video
            console.log("error")
        }
    }
    #observe_load_time(){
        if(this.noextention_count_stop==0||this.noextention_count_stop==1){
            let now_time = new Date().getTime();
            if(!this.no_extention_estimate_stop){
                if(this.innerStartSeconds!=undefined&&this.innerStartSeconds!=0){
                    this.estimate_time = (now_time - this.play_start_time)/1000 + this.innerStartSeconds -2;
                }
                else if(this.seek_time!=undefined&&this.seek_time!=0){
                    this.estimate_time = (now_time - this.play_start_time)/1000 + this.seek_time -2;
                }
                else{
                    this.estimate_time = (now_time - this.play_start_time)/1000 + this.startSeconds -2;
                }
            }
            if(this.endSeconds!=-1&&this.estimate_time>this.endSeconds){
                this.custom_state = 4;
                this.player.dispatchEvent(new Event("onEndVideo"));//再生を終了したことにする
                clearInterval(this.play_start_count_interval);//確認を消去
                this.pauseVideo();
            }
            if(this.noextention_count_stop==1){
                this.noextention_count_stop = 2;
            }
        }

    }
    #observe_end_time(){
        let current_time = this.getCurrentTime();
        if(this.endSeconds!=-1&&this.endSeconds<=current_time){//時間が来た
            this.custom_state = 4;
            clearInterval(this.end_point_observe);
            this.pauseVideo();
            this.player.dispatchEvent(new Event("onEndVideo"));
        }
        else if(this.endSeconds==-1){
            clearInterval(this.end_point_observe);
        }
    }
    
    cueVideoById(content){
        if(content["overwrite"]==undefined){
            content["overwrite"] = true;
        }
        if(content["startSeconds"]!=undefined&&content["overwrite"]==true){
            this.startSeconds = content["startSeconds"];
        }
        this.innerStartSeconds = parseInt(content["startSeconds"]);
        if(content["endSeconds"]!=undefined&&content["overwrite"]==true){
            this.endSeconds = content["endSeconds"];
        }
        this.autoplay_flag = false;
        this.no_extention_pause = true;
        if(content["overwrite"]==true){
            this.videoid = content["videoId"];
        }
        this.#image_player();
    }
    loadVideoById(content){
        if(content["overwrite"]==undefined){
            content["overwrite"] = true;
        }
        if(content["startSeconds"]!=undefined&&content["overwrite"]==true){
            this.startSeconds = content["startSeconds"];
        }
        this.innerStartSeconds = parseInt(content["startSeconds"]);
        if(content["endSeconds"]!=undefined&&content["overwrite"]==true){
            this.endSeconds = content["endSeconds"];
        }
        this.autoplay_flag = true;
        this.no_extention_pause = false;
        this.#video_loader(content);
    }
    async #video_loader(content){
        if(this.player===undefined){
            this.player = this.original_replacing_element;
        }
        this.player.parentElement.childNodes.forEach((node)=>{if(node.tagName==="IMG"){node.remove()}});
        let bilibili_query = {};
        this.videoid = content["videoId"];
        if((await this.#getVideodataApi())["code"]!=0){//video can play or not if code not 0 such as 69002 the video maybe delete.
            this.player.dispatchEvent(new Event("onError"));
            return;
        }
        bilibili_query["bvid"] = content["videoId"];
        const player_state_cahce = await this.getPlayerState();
        if(this.videoid!=content["videoId"]||player_state_cahce==4){
            this.seek_time = -1;
            this.seek_time_used = true;
        }
        this.videoid = content["videoId"];
        if(content["startSeconds"]>0){
            bilibili_query["t"] = content["startSeconds"];
        }
        if(this.autoplay_flag){
            bilibili_query["autoplay"] = 1;
        }
        else{
            bilibili_query["autoplay"] = 0;
        }
        if(content["displayComment"]!=undefined){
            if(content["displayComment"]==0){
                this.displayCommentMode = false;
            }
            else if(content["displayComment"]==1){
                this.displayCommentMode = true;
            }
            else{
                this.displayCommentMode = false;
            }
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
        const new_player = document.createElement("iframe");
        this.player.replaceWith(new_player);
        this.player = new_player;
        if(!mep_bilibili.mep_extension_bilibili){//時間カウント用プログラムの追加
            this.no_extention_estimate_stop = true;
            this.#set_pause_transparent();
            this.player.addEventListener("load",()=>{this.play_start_time = new Date().getTime();this.no_extention_estimate_stop = false;this.play_start_count_interval = setInterval(this.#observe_load_time.bind(this),500);this.player.dispatchEvent(new Event("onReady"))},{once:true});
        }
        this.player.src = mep_bilibili.player_base_url + query_string;
        this.player.allow = "autoplay";//fix bug not autoplay on chrome
        this.player.allowFullscreen = true;//fix bug can't watch on full screen(all browser)
        this.player.style.border = "none";//fix bug display border on outer frame
        this.player.width = this.content_width;
        this.player.height = this.content_height;
        this.#add_player_css_style();
        this.player.classList.add("mep_bilibili_player");
        this.player.hidden = false;
        try{this.player.parentElement.setEvent()}catch{}
        //this.player.sandbox = "allow-scripts";
        if(this.endSeconds!=-1){
            this.end_point_observe = setInterval(this.#observe_end_time.bind(this),500);
        }
    }
    getCurrentTime(){
        if(!mep_bilibili.mep_extension_bilibili){
            if(!this.seek_time_used){
                return this.seek_time;
            }
            else if(this.estimate_time!=undefined){
                return this.estimate_time;
            }
            else{
                return this.startSeconds;
            }
        }
        else{
            return this.state.currentTime;
        }
    }
    playVideo(){
        if(!mep_bilibili.mep_extension_bilibili){
            this.#set_pause_transparent();
            this.no_extention_pause = false;
            this.noextention_count_stop = 0;
            let generate_sorce = {"videoId":this.videoid,"overwrite":false};
            if(this.endSeconds!=-1){
                generate_sorce["endSeconds"] = this.endSeconds;
            }
            if(this.seek_time!=-1&&!this.seek_time_used){
                this.seek_time_used = true;
                generate_sorce["startSeconds"] = this.seek_time;
            }
            else if(this.estimate_time!=0){
                generate_sorce["startSeconds"] = this.estimate_time;
            }
            else if(this.startSeconds!=0){
                generate_sorce["startSeconds"] = this.startSeconds;
            }
            this.loadVideoById(generate_sorce);
            console.log("play!")
        }
        else{
            this.player.contentWindow.postMessage({eventName:"play"},"*");
        }
    }
    pauseVideo(){
        if(!mep_bilibili.mep_extension_bilibili){
            clearInterval(this.play_start_count_interval);
            this.no_extention_pause = true;
            this.noextention_count_stop = 1;
            this.#image_player();
            //this.player.replaceWith(img_element);
            this.seek_time = this.estimate_time;
            try{this.player.parentElement.deleteEvent()}catch{}
            console.log("pause!")
        }
        else{
            this.player.contentWindow.postMessage({eventName:"pause"},"*");
        }
    }
    async seekTo(seektime){
        if(!mep_bilibili.mep_extension_bilibili){
            let generate_sorce = {"videoId":this.videoid,"overwrite":false};
            if(this.endSeconds!=-1){
                generate_sorce["endSeconds"] = this.endSeconds;
            }
            generate_sorce["startSeconds"] = seektime;
            this.seek_time = seektime;
            this.seek_time_used = false;
            let player_state = await this.getPlayerState();
            if(player_state==2){
                this.seek_time_used = true;
                this.loadVideoById(generate_sorce);
            }
            else{
                this.estimate_time = seektime;
                this.cueVideoById(generate_sorce);
            }
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

    async #getVideodataApi(){
        return new Promise(async(resolve,reject)=>{
            let multi_embed_player_class_usable = false;
            try{
                if(multi_embed_player.cors_proxy){};
                multi_embed_player_class_usable = true;
            }
            catch{
                multi_embed_player_class_usable = false;
            }
            let url = "";
            if(multi_embed_player_class_usable){
                url = multi_embed_player.cors_proxy;
            }
            else{
                url = mep_bilibili.cors_proxy;
            }
            if(multi_embed_player_class_usable){
                if(!(this.videoid in multi_embed_player.api_cache.bilibili)){
                    await multi_embed_player_fetch_iframe_api("bilibili",this.videoid,!multi_embed_player.cors_proxy==="",true,false);
                }
                resolve(multi_embed_player.api_cache.bilibili[this.videoid]);
            }
            else{
                if(!(this.videoid in mep_bilibili.bilibili_api_cache)){
                    if(mep_bilibili.cors_proxy===""){
                        mep_bilibili.bilibili_api_cache[this.videoid] = await(await fetch(`${mep_bilibili.api_endpoint}?route=bilibili&videoid=${this.videoid}&image_base64=1`)).json();
                    }
                    else{
                        let json_response_bilibili = await(await fetch(url + `https://api.bilibili.com/x/web-interface/view?bvid=${videoid}`)).json();
                        if(json_response_bilibili?.data?.pic===undefined){
                            json_response_bilibili["image_base64"] = null;
                        }
                        else{
                            json_response_bilibili["image_base64"] = url + json_response_bilibili.data.pic;
                        }
                        mep_bilibili.bilibili_api_cache[this.videoid] = json_response_bilibili;
                    }
                }
                resolve(mep_bilibili.bilibili_api_cache[this.videoid]);
            }
        });
    }

    async getDuration(){
        if(!mep_bilibili.mep_extension_bilibili){
            let videodata_api = await this.#getVideodataApi();
            return videodata_api["data"]["duration"];
        }
        else{
            return this.state.dulation
        }
    }

    async getTitle(){
        if(!mep_bilibili.mep_extension_bilibili){
            let videodata_api = await this.#getVideodataApi();
            return videodata_api["data"]["title"];
        }
        else{
            return this.state.getTitle
        }
    }
    async getPlayerState(){
        if(!mep_bilibili.mep_extension_bilibili){
            const currentTimeCahce = await this.getCurrentTime();
            const realDulationCache = await this.getRealDulation();
            if(currentTimeCahce==undefined||realDulationCache==undefined||realDulationCache==NaN){
                return 0//1のほうが適切かもしれない
            }
            else if(this.innerStartSeconds==currentTimeCahce){
                return 1
            }
            else if(((currentTimeCahce - this.startSeconds)/realDulationCache)>0.99){
                return 4
            }
            else if(this.no_extention_pause){
                return 3
            }
            else if(((currentTimeCahce - this.startSeconds)/realDulationCache)<0.99){//再生中の可能性大
                return 2
            }
            else{
                return 4
            }
        }
        else{
            if(this.state.getPlayerState!=undefined){
                if(this.state.getPlayerState=="READY"){
                    return 1
                }
                else if(this.state.getPlayerState=="PLAYING"){
                    return 2
                }
                else if(this.state.getPlayerState=="PAUSED"){
                    let current_duration = ((this.getCurrentTime()) / ((await this.getDuration()) - this.endSeconds))*100//%で出す
                    if(current_duration>99){
                        return 4
                    }
                    else{
                        return 3
                    }
                }
            }
        }
    }
    setVolume(volume){
        if(!mep_bilibili.mep_extension_bilibili){
            console.warn(mep_bilibili.no_extention_error);
        }
        else{
            this.player.contentWindow.postMessage({eventName:"setVolume",volume:Number(volume/100)},"*");//100で割って差をなくす
        }
    }
    getVolume(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.warn(mep_bilibili.no_extention_error);
        }
        else{
            return this.state.volumeValue
        }
    }
    isMuted(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.warn(mep_bilibili.no_extention_error);
        }
        else{
            if(this.getVolume()!=0){
                return false
            }
            else{
                return true
            }
        }
    }
    mute(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.warn(mep_bilibili.no_extention_error);
        }
        else{
            rhis.before_mute_volume = this.getVolume();
            this.setVolume(0);
        }
    }
    unMute(){
        if(!mep_bilibili.mep_extension_bilibili){
            console.warn(mep_bilibili.no_extention_error);
        }
        else{
            this.setVolume(this.before_mute_volume);
        }
    }
    displayComment(mode){
        if(!mep_bilibili.mep_extension_bilibili){
            console.warn(mep_bilibili.no_extention_error);
        }
        else{
            this.player.contentWindow.postMessage({eventName:"displayComment",commentVisibility:mode},"*");
        }
    }
    #messageListener(){
        this.start_event_count = 0;
        this.end_event_count = 0;
        window.addEventListener("message",(data)=>{
            if(data.data.type=="data_change"){
                this.state = Object.assign(this.state,data.data);
                if(this.start_event_count==0&&data.data.dulation>0){
                    this.start_event_count = 1;
                    this.player.dispatchEvent(new Event("onReady"));
                }
                if(this.end_event_count==0&&data.data.dulation>data.data.currentTime-1&&data.data.getPlayerState=="PAUSED"){
                    this.player.dispatchEvent(new Event("onEndVideo"));
                    this.end_event_count = 1;
                }
            }
            else if(data.data.type=="error"){
                this.player.dispatchEvent(new Event("onError"));
            }
        })
    }
}
if(typeof multi_embed_player_set_variable === "function"){
    multi_embed_player_set_variable(mep_bilibili);
}