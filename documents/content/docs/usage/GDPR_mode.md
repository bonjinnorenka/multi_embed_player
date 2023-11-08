---
weight: 999
title: "GDPR_mode"
description: ""
icon: "article"
date: "2023-11-04T13:30:29+09:00"
lastmod: "2023-11-04T13:30:29+09:00"
draft: false
toc: true
---

## Requirements for GDPR mode

- [iframe api or cors proxy](/docs/install).
- multi_embed_player.js not working in sub iframe api.

## How to turn on GDPR mode

### Enable GDPR mode in all player in HTML

You need to set `follow_GDPR` to `true` in `multi_embed_player_set_variable` function.

```html
<!--before multi_embed_player.js script tag-->
<script type="text/javascript">
    const multi_embed_player_set_variable = (classname)=>{
        //if you want to use GDPR mode all player
        classname.follow_GDPR = true;

        //if you use iframe api
        //classname.iframe_api_endpoint = "YOUR IFRAME API ENDPOINT LIKE https://iframe_api.ryokuryu.workers.dev";

        //if you use cors proxy
        //classname.cors_proxy_url = "YOUR CORS PROXY URL LIKE https://cors-anywhere.herokuapp.com";
    }
</script>
```

### Enable GDPR mode in specific player in HTML

You need to add attribute `follow_GDPR` to `true` in `multi_embed_player` tag.

```html
<multi-embed-player videoid="_NC_pqMt5rY" service="youtube" follow_GDPR="true"></multi-embed-player>
```

<!--live demo of this code-->
<style>
    multi-embed-player{
        width: 480px;
        height: 270px;
    }
</style>
<script src="https://cdn.jsdelivr.net/gh/bonjinnorenka/multi_embed_player@v2/multi_embed_player.js"></script>
<multi-embed-player videoid="_NC_pqMt5rY" service="youtube" follow_GDPR="true"></multi-embed-player>

## Notice

There is no way to back down accept to access external service from embed content in default.

So you may need to set back down accept to access external service button.

This is example of this button.

```html
<button onclick="multi_embed_player_GDPR_accepted_all_back_down()">Back down accept to access external service in embed content</button>
```

<!--live demo of this code-->
<button onclick="multi_embed_player_GDPR_accepted_all_back_down()">Back down accept to access external service in embed content</button>

This way has one known issue.

After use button, you need to reload page to use embed content.

If not to do this, embed content will be load content from external service which is not granted to access because of GDPR mode.
