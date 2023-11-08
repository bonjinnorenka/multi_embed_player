/**
 * Fetches the iframe API for a given service and video ID.
 * @param {string} service - The name of the service.
 * @param {string} videoid - The ID of the video.
 * @param {boolean} use_cors - Whether to use CORS.
 * @param {boolean} image_proxy - The image proxy.
 * @param {boolean} GDPR_access_accept - Whether GDPR access is accepted.
 * @returns {Promise}
 */
const multi_embed_player_fetch_iframe_api = async(service,videoid,use_cors,image_proxy,GDPR_access_accept)=>{
    const xml_first_search = (data,search_string,start=0)=>{
		return data.substring(data.indexOf("<"+search_string+">",start)+search_string.length+2,data.indexOf("</"+search_string+">",start))
	}
    const possible_direct_access = GDPR_access_accept&&multi_embed_player.possible_direct_access_services.includes(service);
    if(use_cors||possible_direct_access){
        let url = "";
        if(possible_direct_access){
            url = "";
        }
        else if(multi_embed_player.cors_proxy!==""){
            url = multi_embed_player.cors_proxy;
        }
        else{
            url = `${multi_embed_player.iframe_api_endpoint}?route=url_proxy&url=`;
        }
        try{
            switch(service){
                case 'soundcloud':
                    const numericRegex = /^[0-9]+$/;
                    let url_oembed;
                    if(numericRegex.test(videoid)){
                        url_oembed = `https://soundcloud.com/oembed?url=https://api.soundcloud.com/tracks/${videoid}&format=json`;
                    }
                    else{
                        url_oembed = `https://soundcloud.com/oembed?url=https://soundcloud.com/${videoid}&format=json`;
                    }
                    const oembed_response_fetch = await fetch(url + encodeURI(url_oembed));
                    let oembed_response = await oembed_response_fetch.json();
                    oembed_response["image_base64"] = url + oembed_response["thumbnail_url"];
                    multi_embed_player.api_cache[service][videoid] = oembed_response;
                    break;
                case 'niconico':
                    const xml_response = await(await fetch(url + `https://ext.nicovideo.jp/api/getthumbinfo/${videoid}`)).text();
                    let image_url = xml_first_search(xml_response,"thumbnail_url");
                    let predict_long = 43+2*(videoid.length-2);
                    let return_data = {};
                    if(image_url.length>predict_long){
                        image_url += ".L";
                    }
                    if(image_url=="<?xml version="){
                        return_data["status"] = "invalid videoid";
                        return_data["thumbnail_url"] = "";
                    }
                    else{
                        return_data["status"] = "success";
                        return_data["thumbnail_url"] = image_url;
                        const search_element_names = {video_id:"video_id",title:"title",description:"description",length:"length",view_counter:"view_count",comment_num:"comment_count",mylist_counter:"mylist_count",first_retrieve:"publish_time",embeddable:"embedable",genre:"genre"};
                        Object.keys(search_element_names).forEach(key_name=>return_data[search_element_names[key_name]] = xml_first_search(xml_response,key_name));
                    }
                    multi_embed_player.api_cache[service][videoid] = return_data;
                    break;
                case 'bilibili':
                    let json_response_bilibili = await(await fetch(url + `https://api.bilibili.com/x/web-interface/view?bvid=${videoid}`)).json();
                    if(json_response_bilibili?.data?.pic===undefined){
                        json_response_bilibili["image_base64"] = null;
                    }
                    else{
                        json_response_bilibili["image_base64"] = url + json_response_bilibili.data.pic;
                    }
                    multi_embed_player.api_cache[service][videoid] = json_response_bilibili;
                    break;
                case "youtube":
                    try{
                        let json_response_youtube = await(await fetch(url + `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoid}&format=json`)).json();
                        json_response_youtube["image_base64"] = url + json_response_youtube["thumbnail_url"];
                        multi_embed_player.api_cache[service][videoid] = json_response_youtube;
                    }
                    catch{
                        multi_embed_player.api_cache[service][videoid] = {};
                    }
                    break;
            }
        }
        catch{
            multi_embed_player.api_cache[service][videoid] = {};
        }
    }
    else{
        const fetch_response = await fetch(`${multi_embed_player.iframe_api_endpoint}?route=${service}&videoid=${videoid}` + (image_proxy?"&image_base64=1":""));
        multi_embed_player.api_cache[service][videoid] = await fetch_response.json();
    }
}

/**
 * Resets all values in multi_embed_player.GDPR_accepted to false and removes the corresponding item from localStorage.
 */
const multi_embed_player_GDPR_accepted_all_back_down = ()=>{
    Object.keys(multi_embed_player.GDPR_accepted).forEach(key=>multi_embed_player.GDPR_accepted[key] = false);
    localStorage.removeItem('multi_embed_player_GDPR_accepted');
}

/**
 * A custom HTML element for embedding multiple video services in a single player.
 * @extends HTMLElement
 */
class multi_embed_player extends HTMLElement{
    static script_origin = "https://cdn.jsdelivr.net/gh/bonjinnorenka/multi_embed_player@v2/";
    static iframe_api_endpoint = "https://iframe_api.ryokuryu.workers.dev";
    static mep_status_load_api = {youtube:0,niconico:0,bilibili:0,soundcloud:0};
    static mep_load_api_promise = {youtube:[],niconico:[],bilibili:[],soundcloud:[]};
    static api_cache = {niconico:{},bilibili:{},soundcloud:{},youtube:{}};
    static GDPR_accept_promise = {youtube:[],niconico:[],bilibili:[],soundcloud:[]};
    static iframe_api_class = {};
    static GDPR_accepted = {youtube:false,niconico:false,bilibili:false,soundcloud:false};
    static possible_direct_access_services = ["youtube","soundcloud"];
    static cors_proxy = "";//if cors_proxy is not empty string,it use instead of iframe_api_endpoint and follow gdpr
    static tearms_policy_service = {"youtube":"https://www.youtube.com/t/terms","niconico":"https://account.nicovideo.jp/rules/account?language=en-us","bilibili":"https://www.bilibili.com/blackboard/protocal/activity-lc1L-pIoh.html","soundcloud":"https://soundcloud.com/pages/privacy"};
    static follow_GDPR = false;
    constructor(){
        super();
        this.videoid = null;
        this.follow_GDPR = multi_embed_player.follow_GDPR;
    }
    async connectedCallback(){
        if(this.getAttribute("follow_GDPR")==="true"){
            this.follow_GDPR = true;
        }
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
                this.image_url = await this.#mep_imageurl(this.videoid,this.service);
                if(!await this.#check_image_status(this.image_url)){
                    this.image_url = await this.#mep_imageurl(this.getAttribute("subVideoid"),this.getAttribute("subService"));
                    if(!await this.#check_image_status(this.image_url)){
                        this.style.backgroundImage = `${multi_embed_player.script_origin}icon/video_not_found.svgz`;
                    }
                }
            }
            if(typeof this.image_url === "string"){
                this.style.backgroundImage = `url(${this.image_url})`;
            }
            else{
                this.style.backgroundImage = `url(${multi_embed_player.script_origin}icon/video_not_found.svgz)`;
            }
            //status setting
            if(this.getAttribute("type")===null||this.getAttribute("type")==="embed"){
                this.addEventListener('click', this.#add_iframe,{once:true});
            }
            if(this.getAttribute("type")==="thumbnail-click"){
                this.addEventListener('click',()=>{this.#PlayOnPlayer(this.getAttribute("for"),this.getAttribute("service"),this.getAttribute("videoid"),this.getAttribute("start"),this.getAttribute("end"),this.getAttribute("subService"),this.getAttribute("subVideoid"))});
                this.addEventListener('contextmenu',(e)=>{e.preventDefault();this.#addPlaylist()});
            }
        }
        else if(this.getAttribute("type")==="player"){
            this.player = {};
            this.player.service = "before embed";
            this.playlist = [];
            this.addEventListener("onEndVideo",()=>{if(this.playlist.length>0){this.loadVideoById(this.playlist.shift())}});//終わりが来たとき次のやつを再生
            this.addEventListener("addPlaylist",()=>{if(this.getPlayerState()===-1||this.getPlayerState()===4){if(this.playlist.length>0){this.loadVideoById(this.playlist.shift())}}});
        }
    }
    /**
     * Checks the status of an image URL.
     * @async
     * @param {string} img_url - The URL of the image to check.
     * @returns {Promise<boolean>} - A promise that resolves to true if the image loads successfully, false otherwise.
     */
    async #check_image_status(img_url){
        if(typeof img_url !== "string"){
            return false;
        }
        const img = new Image();
        img.src = img_url;
        return new Promise((resolve,reject)=>{img.onload = ()=>{img.remove();resolve(true)};img.onerror = ()=>{img.remove();resolve(false)}});
    }
    /**
     * This function adds an iframe to the current element.
     * @param {Event} e - The event that triggered the function. Default is null.
     * @param {boolean} sub - A flag to indicate whether the iframe is a subframe. Default is false.
     */
    async #add_iframe(e=null,sub=false){
        let content = new mep_playitem(this.getAttribute("service"),this.getAttribute("videoid"));
        if(this.getAttribute("start")!=null){
            content.startSeconds = this.getAttribute("start");
        }
        if(this.getAttribute("end")!=null){
            content.endSeconds = this.getAttribute("end");
        }
        if(this.getAttribute("subvideoid")!=null&&this.getAttribute("subservice")!=null){
            content.subVideoid = this.getAttribute("subvideoid");
            content.subService = this.getAttribute("subservice");
        }
        this.player = {};
        this.loadVideoById(content.toData());
    }
    /**
     * Asynchronously fetches the image URL for a given video ID and service.
     * @param {string} videoid - The ID of the video to fetch the image for.
     * @param {string} service - The service to fetch the image from.
     * @param {string} [filetype=null] - The type of file to fetch.
     * @returns {Promise<string>} - A promise that resolves with the image URL.
     */
    async #mep_imageurl(videoid,service,filetype=null){//必ずawaitを使って叩くこと
        let GDPR_accepted = false;
        if (!this.follow_GDPR) {
            GDPR_accepted = true;
        } else if (this.follow_GDPR && !multi_embed_player.GDPR_accepted[service]) {
            GDPR_accepted = false;
        } else if (this.follow_GDPR && multi_embed_player.GDPR_accepted[service]) {
            GDPR_accepted = true;
        }
        let image_url = "";
        let use_cors = false;
        if(GDPR_accepted){
            if(multi_embed_player.cors_proxy!==""){
                image_url = multi_embed_player.cors_proxy;
                use_cors= true;
            }
            else{
                image_url = `${multi_embed_player.iframe_api_endpoint}?route=url_proxy&url=`;
            }
        }
        if(multi_embed_player.cors_proxy!==""){
            use_cors= true;
        }
        if(!GDPR_accepted||service==="bilibili"){//if follow gdpr or bilibili(bilibili don't allow to fetch thumbnail from crossorigin)
            if(!(videoid in multi_embed_player.api_cache[service])){
                await multi_embed_player_fetch_iframe_api(service,videoid,use_cors,true,false);
            }
            return multi_embed_player.api_cache[service][videoid]["image_base64"];
        }
        /*else if(service==="niconico"){
            if(!(videoid in multi_embed_player.api_cache[service])){
                await this.fetch_iframe_api(service,videoid,use_cors,false,GDPR_accepted);
            }
            return image_url + multi_embed_player.api_cache[service][videoid]["image"];
        }*/
        else if(service==="soundcloud"||service==="youtube"||service==="niconico"){
            if(!(videoid in multi_embed_player.api_cache[service])){
                await multi_embed_player_fetch_iframe_api(service,videoid,use_cors,!GDPR_accepted,GDPR_accepted);
            }
            if(!GDPR_accepted){
                return multi_embed_player.api_cache[service][videoid]["image_base64"];
            }
            else{
                return multi_embed_player.api_cache[service][videoid]["thumbnail_url"];
            }
        }
        else{
            image_url = "invalid_url";
            return image_url
        }
        
    }
    /**
     * Asynchronously accepts GDPR for a given service.
     * @param {string} service - The name of the service to accept GDPR for.
     * @returns {Promise<void>} - A promise that resolves when GDPR is accepted.
     */
    async #GDPR_accept(service){
        return new Promise(async(resolve,reject)=>{
            if(this.follow_GDPR){
                if(multi_embed_player.GDPR_accepted[service]){
                    resolve();
                }
                else{
                    multi_embed_player.GDPR_accept_promise[service].push(resolve);
                    const GDPR_check_div = document.createElement("div");
                    const firest_p_element = document.createElement("p");
                    firest_p_element.innerText = "This content is hosted by a third party.\nBy showing the external content you accept the terms and conditions";
                    GDPR_check_div.appendChild(firest_p_element);
                    const tearms_link = document.createElement("a");
                    tearms_link.href = multi_embed_player.tearms_policy_service[service];
                    tearms_link.target = "_blank";
                    tearms_link.innerText = `${service} terms and conditions`;
                    GDPR_check_div.appendChild(tearms_link);
                    const second_p_element = document.createElement("p");
                    second_p_element.innerText = `service hosted by ${service} is not under our control and can change without notice.\nIf you notice any change, please let us know.\nAlso this accept status save for this domain localstorage if you accept and can access for this.`;
                    GDPR_check_div.appendChild(second_p_element);
                    const button_agree = document.createElement("button");
                    button_agree.innerText = "I accept";
                    button_agree.addEventListener("click",()=>{multi_embed_player_GDPR_reviever(service)});
                    GDPR_check_div.appendChild(button_agree);
                    //remove all children of this
                    while(this.firstChild){
                        this.removeChild(this.firstChild);
                    }
                    this.appendChild(GDPR_check_div);
                    this.style.backgroundImage = "";
                }
            }
            else{
                resolve();
            }
        });
    }
    /**
     * Loads a video by its ID and sets the autoplay and subtitle options.
     * @async
     * @param {Object} data - The data object containing the video ID, service, start time, and end time.
     * @param {boolean} [autoplay=true] - Whether or not to autoplay the video.
     * @param {boolean} [sub=false] - Whether or not to load a subtitle. @deprecated
     * @returns {Promise<void>}
     */
    async loadVideoById(data,autoplay=true,sub=false){
        this.autoplay = autoplay;
        if(this.player!=undefined){
            let service_changed = false;
            this.error_not_declare = false;
            if(data===null||(Array.isArray(data.call_array) && typeof data.call_index==="number")){
                if(data!==null){
                    this.previousData = data;
                }
                else{
                    data = this.previousData;
                }
                data = Object.assign({},data,data.call_array[data.call_index]);
                this.videoid = data.videoId;
                this.service = data.service;
                if(data.call_array.length-1 < data.call_index){
                    console.error("too large call_index");
                }
                else if(data.call_array.length-1 === data.call_index){
                    this.error_not_declare = false;
                }
                else{
                    this.error_not_declare = true;
                    this.addEventListener("executeSecound",()=>{this.loadVideoById(null,autoplay,false)},{once:true});
                }
                if(this.service!==this.player.service){
                    this.#deleteEvent();
                    service_changed = true;
                }
                this.previousData.call_index++;
            }
            else{
                if(sub==false){//1回目
                    this.previousData = data;
                    if(typeof data.subVideoId==="string"&&typeof data.subService==="string"){
                        this.error_not_declare = true;
                        this.addEventListener("executeSecound",()=>{this.loadVideoById(null,autoplay,false)},{once:true}); 
                    }
                    if(data.service!=this.player.service){
                        this.#deleteEvent();
                        service_changed = true;
                        this.service = data.service;
                    }
                    this.videoid = data.videoId;
                }
                else if(sub==true){
                    data = this.previousData;
                    this.#deleteEvent();
                    service_changed = true;
                    this.videoid = data.subVideoId;
                    this.service = data.subService;
                }
            }
            await this.#GDPR_accept(data.service);
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
                    let playerVars = {}
                    if(autoplay){
                        playerVars.autoplay = 1;
                    }
                    if(data["startSeconds"]!=undefined){
                        playerVars.start = data["startSeconds"];
                    }
                    if(data["endSeconds"]!=undefined){
                        playerVars.end = data["endSeconds"];
                    }
                    this.player = new YT.Player(divdoc, {
                        height: '315',
                        width: '560',
                        videoId: this.videoid,
                        playerVars: playerVars,
                        host: 'https://www.youtube-nocookie.com',
                    });
                    if(autoplay==false){
                        this.player.addEventListener("onReady",()=>{this.player.stopVideo()},{once: true});
                    }
                    this.#setEvent();
                    this.player.service = "youtube";
                }
            }
            else if(Object.keys(multi_embed_player.mep_load_api_promise).includes(this.service)){
                await this.iframe_api_loader(this.service);
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
                    divdoc.classList.add(`mep_${this.service}`);
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
                    let player_argument = {
                        "videoId":this.videoid,
                        "width":"560",
                        "height":"315",
                        "playerVars":playerVars
                    };
                    if(this.service=="bilibili"&&this.getAttribute("play_control_wrap")==="false"){
                        player_argument["play_control_wrap"] = false;
                    }
                    else{
                        player_argument["play_control_wrap"] = true;
                    }
                    this.player = new multi_embed_player.iframe_api_class[this.service](divdoc,player_argument,this.#setEvent.bind(this));
                    this.player.service = this.service;
                }
            }
            else{
                console.error(`service name not defined ${this.service}`)
            }
        }
        else{
            console.log("player not found.");
        }
    }
    /**
     * Sets event listeners for the player.
     * @param {HTMLElement} element - The element to set the event listeners on.
     */
    #setEvent(element){
        try{
            if(typeof element === "undefined"){
                if(this.service=="youtube"){
                    this.player.addEventListener("onReady",()=>{this.dispatchEvent(new Event("onReady"))});//need bind
                    this.player.addEventListener("onError",()=>{if(!this.error_not_declare){this.dispatchEvent(new Event("onError"))}else{this.dispatchEvent(new Event("executeSecound"))}});
                    this.player.addEventListener("onStateChange",()=>{this.dispatchEvent(new Event("onStateChange"))});
                    this.player.addEventListener("onStateChange",async()=>{if(await this.getCurrentTime()>this.getDuration()-1||(this.endSeconds!=-1&&await this.getCurrentTime()!=0&&this.endSeconds-1<=await this.getCurrentTime())){this.dispatchEvent(new Event("onEndVideo"))}})
                }
                else if(Object.keys(multi_embed_player.mep_load_api_promise).includes(this.service)){
                    this.player.player.addEventListener("onReady",()=>{this.dispatchEvent(new Event("onReady"))});//need bind
                    this.player.player.addEventListener("onError",()=>{if(!this.error_not_declare){this.dispatchEvent(new Event("onError"))}else{this.dispatchEvent(new Event("executeSecound"))}});
                    this.player.player.addEventListener("onStateChange",()=>{this.dispatchEvent(new Event("onStateChange"))});
                    this.player.player.addEventListener("onEndVideo",()=>{this.dispatchEvent(new Event("onEndVideo"))});
                }
                else{
                    console.error(`service ${this.service} not found at multi_embed_player class setEvent()`);
                }
            }
            else{
                if(Object.keys(multi_embed_player.mep_load_api_promise).includes(this.service)){
                    element.addEventListener("onReady",()=>{this.dispatchEvent(new Event("onReady"))});
                    element.addEventListener("onError",()=>{if(!this.error_not_declare){this.dispatchEvent(new Event("onError"))}else{this.dispatchEvent(new Event("executeSecound"))}});
                    element.addEventListener("onStateChange",()=>{this.dispatchEvent(new Event("onStateChange"))});
                    element.addEventListener("onEndVideo",()=>{this.dispatchEvent(new Event("onEndVideo"))});
                }
                else{
                    console.error(`service ${this.service} not found at multi_embed_player class setEvent(element)`);
                }
            }
        }
        catch(e){
            console.log("failed to set event. under log is error message.");
            console.log(e);
        }
    }
    /**
     * Removes event listeners for the current player service.
     * @returns {void}
     */
    #deleteEvent(){//plese before change service
        try{
            if(this.service=="youtube"){
                this.player.removeEventListener("onReady",()=>{this.dispatchEvent(new Event("onReady"))});//need bind
                this.player.removeEventListener("onError",()=>{if(!this.error_not_declare){this.dispatchEvent(new Event("onError"))}else{this.dispatchEvent(new Event("executeSecound"))}});
                this.player.removeEventListener("onStateChange",()=>{this.dispatchEvent(new Event("onStateChange"))});
                this.player.removeEventListener("onStateChange",()=>{if(this.getCurrentTime()>this.getDuration()-1||(this.endSeconds!=-1&&this.endSeconds-1<=this.getCurrentTime())){this.dispatchEvent(new Event("onEndVideo"))}})
            }
            else if(Object.keys(multi_embed_player.mep_load_api_promise).includes(this.service)){
                this.player.player.removeEventListener("onReady",()=>{this.dispatchEvent(new Event("onReady"))});//need bind
                this.player.player.removeEventListener("onError",()=>{if(!this.error_not_declare){this.dispatchEvent(new Event("onError"))}else{this.dispatchEvent(new Event("executeSecound"))}});
                this.player.player.removeEventListener("onStateChange",()=>{this.dispatchEvent(new Event("onStateChange"))});
                this.player.player.removeEventListener("onEndVideo",()=>{this.dispatchEvent(new Event("onEndVideo"))});
            }
            else{
                console.error(`service ${this.service} not found at multi_embed_player class deleteEvent()`);
            }
        }
        catch{}
    }
    /**
     * Plays the video.
     */
    playVideo(){
        this.player.playVideo();
    }
    /**
     * Pauses the video.
     */
    pauseVideo(){
        this.player.pauseVideo();
    }
    /**
     * Stops the video.
     * @deprecated
     */
    stopVideo(){//depricated
        this.player.pauseVideo();
    }
    /**
     * Returns the current time of the video.
     * @returns {Promise<number>} - A promise that resolves with the current time of the video. promise only bilibili
     */
    async getCurrentTime(){
        if(this.service=="bilibili"){
            return await this.player.getCurrentTime();
        }
        else{
            return this.player.getCurrentTime();
        }
    }
    /**
     * Seeks to a given time in the video.
     * @param {number} seconds - if service is bilibili, return promise
     */
    async seekTo(seconds){
        await this.player.seekTo(seconds);
    }
    /**
     * Mutes the video.
     */
    mute(){
        this.player.mute();
    }
    /**
     * Unmutes the video.
     */
    unMute(){
        this.player.unMute();
    }
    /**
     * Returns whether the video is muted.
     * @returns {boolean} - Whether the video is muted.if service is bilibili, return promise
     */
    isMuted(){
        return this.player.isMuted();
    }
    /**
     * Set the volume of the player.
     * @param {number} volume - The volume level to set.
     */
    setVolume(volume){
        this.player.setVolume(Number(volume));
    }
    /**
     * Returns the current volume of the player.
     * @returns {number} The current volume of the player.
     */
    getVolume(){
        return this.player.getVolume();
    }
    /**
     * Returns the duration of the current video.
     * @returns {number} The duration of the current video in seconds.
     */
    getDuration(){
        return this.player.getDuration();
    }
    /**
     * Returns the real duration of the video based on the start and end seconds.
     * @returns {number} The real duration of the video.
     */
    getRealDulation(){
        if(this.service=="youtube"){
            if(this.endSeconds==-1){
                return this.getDuration() - this.startSeconds;
            }
            else{
                return this.endSeconds - this.startSeconds;
            }
        }
        else if(Object.keys(multi_embed_player.mep_load_api_promise).includes(this.service)){
            return this.player.getRealDulation();
        }
        else{
            return 0;
        }
    }
    /**
     * Returns the relative current time by subtracting the start time from the current time.
     * @returns {Promise<number>} The relative current time.
     */
    async getRelativeCurrentTime(){
        return await this.getCurrentTime() - this.startSeconds;
    }
    /**
     * Calculates the percentage of the current time relative to the total duration of the media.
     * @returns {number} The percentage of the current time.
     */
    getPercentOfCurremtTime(){//notice sometimes over 100%
        return (this.getRelativeCurrentTime()/this.getRealDulation())*100
    }
    /**
     * Seeks to a relative position in the video based on the current time.
     * @param {number} seconds - The number of seconds to seek relative to the current time.
     */
    relativeSeekTo_ct(seconds){//current time + seek time
        this.seekTo(seconds + this.getCurrentTime());
    }
    /**
     * Start seeking from the given seconds plus the startSeconds.
     * @param {number} seconds - The seconds to seek from.
     */
    relativeSeekTo_ss(seconds){//startSeconds + seek time
        this.seekTo(seconds + this.startSeconds);
    }
    /**
     * Returns the current state of the player.
     * @returns {number} The player state:
     * -1 -> not set video mainly before embed
     * 0 -> not played only thumnail
     * 1 -> onload
     * 2 -> playing
     * 3 -> pause
     * 4 -> video ended
     */
    getPlayerState(){
        /*
        -1->not set video mainly before embed
        0->not played only thumnail
        1->onload
        2->playing
        3->pause
        4->video ended
        */
        if(Object.keys(multi_embed_player.mep_load_api_promise).includes(this.service)){
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
            return -1
        }
    }
    /**
     * Plays a video on the specified player with the given parameters.
     * @param {string} playerid - The ID of the player element.
     * @param {string} service - The service provider (e.g. YouTube, Vimeo).
     * @param {string} videoid - The ID of the video to play.
     * @param {number|null} start - The start time of the video in seconds (optional).
     * @param {number|null} end - The end time of the video in seconds (optional).
     * @param {string|null} subService - The service provider for the subtitle (optional).
     * @param {string|null} subVideoid - The ID of the subtitle video (optional).
     */
    #PlayOnPlayer(playerid,service,videoid,start,end,subService,subVideoid){
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
    /**
     * Loads the YouTube API asynchronously and returns a Promise that resolves when the API is ready.
     * If the API is already loaded, the Promise resolves immediately.
     * If the API is currently being loaded, the Promise will resolve when the API is ready.
     * @returns {Promise<void>} A Promise that resolves when the YouTube API is ready.
     */
    async youtube_api_loader(){
        return new Promise(async(resolve,reject)=>{
            if(multi_embed_player.mep_status_load_api.youtube===0){
                let script_url = "https://www.youtube.com/iframe_api";
                multi_embed_player.mep_status_load_api.youtube = 1;
                await this.mep_promise_script_loader(script_url);
                YT.ready(()=>{multi_embed_player.mep_load_api_promise.youtube.forEach(func=>func());multi_embed_player.mep_status_load_api.youtube = 2;resolve()});
            }
            else if(multi_embed_player.mep_status_load_api.youtube==1){
                multi_embed_player.mep_load_api_promise.youtube.push(resolve);
            }
            else{
                resolve();
            }
        });
    }
    /**
     * Loads the API for the specified service and returns a promise that resolves when the API is loaded.
     * @async
     * @param {string} service - The name of the service whose API needs to be loaded.
     * @returns {Promise<void>} A promise that resolves when the API is loaded.
     */
    async iframe_api_loader(service){
        return new Promise(async(resolve,reject)=>{
            if(multi_embed_player.mep_status_load_api[service]===0){
                multi_embed_player.mep_status_load_api[service] = 1;
                await this.mep_promise_script_loader(`${multi_embed_player.script_origin}iframe_api/${service}.js`);
                multi_embed_player.mep_status_load_api[service] = 2;
                switch(service){
                    case "niconico":
                        multi_embed_player.iframe_api_class["niconico"] = mep_niconico;
                        break;
                    case "bilibili":
                        multi_embed_player.iframe_api_class["bilibili"] = mep_bilibili;
                        break;
                    case "soundcloud":
                        multi_embed_player.iframe_api_class["soundcloud"] = mep_soundcloud;
                        break;
                }
                multi_embed_player.mep_load_api_promise[service].forEach(func=>func());
                resolve();
            }
            else if(multi_embed_player.mep_status_load_api[service]===1){
                multi_embed_player.mep_load_api_promise[service].push(resolve);
            }
            else{
                resolve();
            }
        })
    }
    /**
     * Loads a script asynchronously and returns a promise that resolves when the script is loaded successfully or rejects when there is an error.
     * @param {string} src - The URL of the script to be loaded.
     * @returns {Promise<void>} - A promise that resolves when the script is loaded successfully or rejects when there is an error.
     */
    async mep_promise_script_loader(src){
        return new Promise((resolve,reject)=>{
            let script_document = document.createElement("script");
            script_document.src = src;
            script_document.async = true;
            document.body.appendChild(script_document);
            script_document.addEventListener("load",()=>{
                resolve();
            },{once:true});
            script_document.addEventListener("error",()=>{
                reject();
            },{once:true});
        })
    }
    /**
     * Adds a new play item to the playlist of the player.
     * @function
     * @name addPlaylist
     * @memberof Player
     * @returns {void}
     */
    #addPlaylist(){
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
        this.call_array = [];
    }
    toData(){
        let content = {"service":this?.service,"videoId":this?.videoid,call_array:this.call_array,call_index:0};
        if(this.service!==undefined&&this.videoid!==undefined){
            content.call_array.push({videoId:this.videoid,service:this.service});
        }
        if(this.startSeconds!=undefined){
            content["startSeconds"] = this.startSeconds;
        }
        if(this.endSeconds!=undefined){
            content["endSeconds"] = this.endSeconds;
        }
        if(this.subService!=undefined&&this.subVideoid!=undefined){
            content["subService"] = this.subService;
            content["subVideoId"] = this.subVideoid;
            content.call_array.push({videoId:this.subVideoid,service:this.subService});
        }
        return content
    }
}
class mep_parallel{
    constructor(){
        this.data = [];//class mep_parallel_inner
    }
    parse(){
        
    }
}
class mep_parallel_inner{
    constructor(service,videoid){
        this.service = service;
        this.videoid = videoid;
    }
}
if(typeof multi_embed_player_set_variable === "function"){
    multi_embed_player_set_variable(multi_embed_player);
}

//load GDPR status
try{
    if(localStorage.getItem("multi_embed_player_GDPR_accepted")!==null){
        multi_embed_player.GDPR_accepted = JSON.parse(localStorage.getItem("multi_embed_player_GDPR_accepted"));
    }
}
catch{
    console.log("failed to load GDPR status may be not supported browser or not accept to access localstorage");
}

const multi_embed_player_save_GDPR_status = ()=>{
    try{
        localStorage.setItem("multi_embed_player_GDPR_accepted",JSON.stringify(multi_embed_player.GDPR_accepted));
    }
    catch{
        console.log("failed to save GDPR status may be not supported browser or not accept to access localstorage");
    }
}

//recieve GDPR accept by service
const multi_embed_player_GDPR_reviever = (service)=>{
    multi_embed_player.GDPR_accepted[service] = true;
    multi_embed_player_save_GDPR_status();
    multi_embed_player.GDPR_accept_promise[service].forEach(func=>func());
}

//Add multi embed player CSS
const multi_embed_player_css = document.createElement("style");
multi_embed_player_css.innerHTML = `
multi-embed-player{
    display: block;
    position: relative;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
}
multi-embed-player>iframe{
    width: 100%;
    height: 100%;
}
multi-embed-player>picture{
    position: absolute;
    width: 100%;
    height: 100%;
    z-index: -1;
}`;
multi_embed_player_css.classList.add("multi-embed-player-CSS");
document.head.appendChild(multi_embed_player_css);
customElements.define('multi-embed-player', multi_embed_player);//define custom element