function logURL(requestDetails) {
    console.log(`Loading: ${requestDetails.url}`);
    let now_url = new URL(requestDetails.url);
    let ori_path = now_url.origin+now_url.pathname;
    console.log("href:"+ori_path)
    if(ori_path=="https://player.bilibili.com/main/html5/outer/liteplayer.min.js"){
        console.log("redirect success " + requestDetails.url)
        return{redirectUrl:browser.runtime.getURL("liteplayer.js")};
    }
    else if(ori_path=="https://js.ryokuryu.com/multi_embed_player/no_extention.json"){
        console.log("redirect success " + requestDetails.url)
        return{redirectUrl:browser.runtime.getURL("extention.json")};
    }
    else if(ori_path=="https://player.bilibili.com/tools/player-selector/player-selector.min.js"){
        console.log("redirect success " + requestDetails.url)
        return{redirectUrl:browser.runtime.getURL("player-selector.js")}
    }
    else{
        return;
    }
}
  
browser.webRequest.onBeforeRequest.addListener(
    logURL,
    {urls: ["*://player.bilibili.com/*","*://js.ryokuryu.com/*"]},
    ["blocking"]
);