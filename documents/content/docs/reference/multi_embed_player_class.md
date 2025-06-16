---
weight: 5100
title: "Multi_embed_player_class"
description: ""
icon: "article"
date: "2023-11-04T16:48:57+09:00"
lastmod: "2023-11-04T16:48:57+09:00"
draft: false
toc: true
---

Defined at [multi_embed_player.js](https://github.com/bonjinnorenka/multi_embed_player/blob/main/multi_embed_player.js)

## variable list of multi_embed_player class

{{< table "table-responsive" >}}

|variable name|type|default value|description|
|---|---|---|---|
|cors_proxy_url|string||cors proxy url|
|iframe_api_endpoint|string|https://iframe_api.ryokuryu.workers.dev|[iframe api endpoint](/docs/reference/iframe_api)|
|follow_GDPR|boolean|false|follow GDPR mode|
|script_origin|string|https://cdn.jsdelivr.net/gh/bonjinnorenka/multi_embed_player@v2/|script origin|
|mep_status_load_api|Object|{serviceName:number}|load api status <br>0->not load<br>1->loading<br>2->loaded|
|mep_load_api_promise|Object|{serviceName:[function]}|waiting load api function<br>functions will be called when api loaded|
|api_cache|Object|{serviceName:{[iframe api response](/docs/reference/iframe_api)}}|api cache of iframe api response|
|GDPR_accept_promise|Object|{serviceName:[function]}|waiting GDPR accept function<br>functions will be called when GDPR accepted|
|iframe_api_class|Object|{}|iframe sub api class<br>add value after iframe sub api loaded|
|GDPR_accepted|Object|{serviceName:boolean}|GDPR accepted status|
|possible_direct_access_services|string[]|[servicename]|services that can be accessed directly when GDPR accepted|
|tearms_policy_service|string|{servicename:policy url}|tearms policy url for specific service|

{{< /table >}}

## function list of multi_embed_player class instance

Not include function start with '#'.

{{< table "table-responsive" >}}

|function name|arguments|response|description|
|---|---|---|---|
|connectedCallback|||called when custom element connected|
|loadVideoById|{loadVideoByIdOptions},autoplay:boolean(optional),sub:boolean(optional internal compatible)||load video by id for player|
|playVideo|||play video for player|
|pauseVideo|||pause video for player|
|stopVideo|||pause video for player **compatibility**|
|getcurentTime||bilibili->Promise of number(seconds) <br>others -> number(seconds)|get curent time for player|
|seekTo|number(seconds)||seek to time for player|
|mute|||mute for player|
|unMute|||unmute for player|
|isMuted||bilibili->promise of boolean<br>others->boolean|check mute status for player|
|setVolume|number(0-100)||set volume for player|
|getVolume||bilibili->promise of number(0-100)<br>others->number(0-100)|get volume for player|
|getDuration||bilibili->promise of number(seconds)<br>others->(seconds)|get duration for player|
|getRealDuration||bilibili->promise of number(seconds)<br>others->number(seconds)|return duration between start and end seconds|
|getRelativeCurrentTime||bilibili->promise of number(seconds)<br>others->number(seconds)|return current time count from start seconds|
|getPercentOfCurrentTime||bilibili->promise of number(seconds)<br>others->number(seconds)|return current time percent from dulation<br>NOTE:sometimes return over 100% value|
|relativeSeekTo_ct|number(seconds)||seek to time count from current secounds|
|relativeSeekTo_ss|number(seconds)||seek to time count from start secounds|
|getPlayerState||number|get player state<br>-1->not set video mainly before embed<br>0->not playing only thumbnail<br>1->onloaded(include cue)<br>2->playing<br>3->paused<br>4->video ended|

{{< /table >}}

## event list of multi_embed_player class

{{< table "table-responsive" >}}

| Event Name | Type | Description | value |
|------------|------|-------------|-------|
| `onReady` | Event | Fired when the player is ready | None |
| `onError` | CustomEvent | Fired when an error occurs | [Error code](/docs/reference/error_code) | 
| `onStateChange` | CustomEvent | Fired when the player's state changes | player state |
| `onEndVideo` | Event | Fired when the video playback ends | None |
| `executeSecound` | Event | Fired to trigger secondary action (error handling) | None |

{{< /table >}}

### loadVideoByIdOptions

{{< table "table-responsive" >}}

|variable name|type|require|default value|description|
|---|---|---|---|---|
|videoId|string|true||video id if call array is defined this value is ignored and not required|
|service|string|true||service name if call array is defined this value is ignored not required|
|startSeconds|number|false|0|start seconds|
|endSeconds|number|false||end seconds|
|call_array|[call_video_object]|false||call array|
|call_array_index|number|false|0|call array index|
|subVideoId|string|false||sub video id **compatibility**|
|subService|string|false||sub service name **compatibility**|

{{< /table >}}

### call_video_object

{{< table "table-responsive" >}}

|variable name|type|require|default value|description|
|---|---|---|---|---|
|videoId|string|true||video id|
|service|string|true||service name|

{{< /table >}}

## AI Assistance Disclosure
This documentation page includes content generated with the assistance of AI tools. Specifically:

Claude 3.5 Sonnet
GitHub Copilot

All AI-generated content has been reviewed and edited by a human to ensure accuracy and relevance.
