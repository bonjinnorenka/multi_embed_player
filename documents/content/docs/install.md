---
weight: 200
title: "Install"
description: ""
icon: "article"
date: "2023-11-04T12:12:58+09:00"
lastmod: "2023-11-04T12:12:58+09:00"
draft: false
toc: true
---

## Iframe API

If you want to use

- GDPR mode
- below service player,

you need to install multi_embed_player iframe_api to [Cloudflare workers](https://workers.cloudflare.com/)
or using cors proxy like [cors-anywhere](https://github.com/Rob--W/cors-anywhere).

Need install service list

- bilibili
- nicovideo

### Use iframe api

#### Install iframe_api to cloudflare workers

```bash
git clone https://github.com/bonjinnorenka/multi_embed_player.git
cd multi_embed_player/player_api_gate/iframe_api
npm install
npm run deploy
```

#### Set option in html

```html
<!--before multi_embed_player.js script tag-->
<script type="text/javascript">
    const multi_embed_player_set_variable = (classname)=>{
        classname.iframe_api_endpoint = "YOUR IFRAME API ENDPOINT LIKE https://iframe_api.ryokuryu.workers.dev";
    }
</script>
```

### Use cors proxy

Cors proxie requirement

- send get request
- return response with cors header if your cors proxy is other domain

#### set cors proxy url

```html
<!--before multi_embed_player.js script tag-->
<script type="text/javascript">
    const multi_embed_player_set_variable = (classname)=>{
        classname.cors_proxy_url = "YOUR CORS PROXY URL LIKE https://cors-anywhere.herokuapp.com";
    }
</script>
```

## Documents

Documents provided with this page.

But if you want to install locally, please follow the steps below.

### Deploy to local

**You need to install hugo 0.120.3 or later And extended version.**

```bash
git clone https://https://github.com/bonjinnorenka/multi_embed_player.git
cd multi_embed_player/documents
hugo
```

### Deploy to cloudflare pages or netlify

you need to some settings.

- set root directory to `documents`
- hugo version set to 0.120.3 or later using environment variable `HUGO_VERSION`
- you need to set `HUGO_BASEURL` to your domain if you want to use robots.txt and set sitemap.xml correctly.

Netlify only (maybe)

- output directory set to `documents/public`
- Need to set GO version to 1.21.3 or later using environment variable `GO_VERSION`
