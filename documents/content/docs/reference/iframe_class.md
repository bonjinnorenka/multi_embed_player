---
weight: 5200
title: "Iframe_class"
description: ""
icon: "article"
date: "2023-11-04T18:33:04+09:00"
lastmod: "2023-11-04T18:33:04+09:00"
draft: false
toc: true
---

## common object

### Load_video_option_object

|variable name|type|require|default value|description|
|---|---|---|---|---|
|videoId|string|true||video id for player|
|startSeconds|number|false|0|start seconds for player|
|endSeconds|number|false||end seconds for player|

### player_content_object

|variable name|type|require|default value|description|
|---|---|---|---|---|
|videoId|string|true||video id for player|
|startSeconds|number|false|0|start seconds for player|
|endSeconds|number|false||end seconds for player|
|playerVars|Object{urlparameter:value}|false|{}|player vars for player|
|width|number|true||width for player|
|height|number|true||height for player|

## mep_niconico class

defined at [niconico.js](https://github.com/bonjinnorenka/multi_embed_player/blob/main/iframe_api/niconico.js)

### variable list

|variable name|type|default value|description|
|---|---|---|---|
|playerId|number|0|player id for detect iframe|
|origin|string|https://embed.nicovideo.jp|iframe origin|
|localStorageCheck|null or boolean|null|localStorage check result **compatibility**|

### function list

|function name|arguments|response|description|
|---|---|---|---|
|constructor|replacing_element:Node Or String(dom id),player_content_object,player_set_event_function:function||constructor of class|
|cueVideoById|Load_video_option_object||cue video by id for player|
|loadVideoById|Load_video_option_object||load video by id for player|
|getRealDuration||number(seconds)|return duration between start and end seconds|
|playVideo|||play video for player|
|pauseVideo|||pause video for player|
|getCurrentTime||number(seconds)|get curent time for player|
|getDuration||number(seconds)|get duration for player|
|getTitle||string|get title for playing video|
|isMuted||boolean|check mute status for player|
|getVolume||number(0-100)|get volume for player|
|seekTo|number(seconds)||seek to time for player|
|displayComment|boolean||display comment for player|
|mute|||mute for player|
|unMute|||unmute for player|
|setVolume|number(0-100)||set volume for player|
|getPlayerState||number|get player state<br>0->not playing only thumbnail<br>1->onloaded(include cue)<br>2->playing<br>3->paused<br>4->video ended

## mep_bilibili class

defined at [bilibili.js](https://github.com/bonjinnorenka/multi_embed_player/blob/main/iframe_api/bilibili.js)

### variable list

|variable name|type|default value|description|
|---|---|---|---|
|localStorageCheck|null or boolean|null|localStorage check result|
| mep_extention_bilibili| boolean |false| extention mode|
| api_endpoint| string |https://iframe_api.ryokuryu.workers.dev| api endpoint you must change it or set cors proxy|
| no_extention_error| string | "No extention error description"| error message when extention is not found|
| player_base_url| string | ""| base url for player it will auto select|
|bilibili_api_cache|Object{videoId:video_info}|{}|cache for bilibili api|
| cors_proxy | string | "" | cors proxy endpoint|

### function list

|function name|arguments|response|description|
|---|---|---|---|
|constructor|replacing_element:Node Or String(dom id),player_content_object,player_set_event_function:function||constructor of class|
|cueVideoById|Load_video_option_object||cue video by id for player|
|loadVideoById|Load_video_option_object||load video by id for player|
| getCurrentTime | | number(seconds) | get curent time for player |
|playVideo|||play video for player|
|pauseVideo|||pause video for player|
|seekTo|number(seconds)||seek to time for player|
|getRealDuration||promise number(seconds) if no extention|return duration between start and end seconds|
|getDuration||promise number(seconds) if no extention|get duration for player|
|getTitle||promise string if no extention|get title for playing video|
|getPlayerState||promise number|get player state<br>0->not playing only thumbnail<br>1->onloaded(include cue)<br>2->playing<br>3->paused<br>4->video ended
|setVolume|number(0-100)||set volume for player **not working if no extention**|
|getVolume||number(0-100)|get volume for player **not working if no extention**|
|isMuted||boolean|check mute status for player **not working if no extention**|
|mute|||mute for player **not working if no extention**|
|unMute|||unmute for player **not working if no extention**|
|displayComment|boolean||display comment for player **not working if no extention**|

## mep_soundcloud class

defined at [soundcloud.js](https://github.com/bonjinnorenka/multi_embed_player/blob/main/iframe_api/soundcloud.js)

### variable list

|variable name|type|default value|description|
|---|---|---|---|
|soundcloud_api_loaded|boolean or null|null|soundcloud api loaded status|
|soundcloud_api_promise|Array of function|[]|after load soundcloud api call this functions|
|numericRegex|RegExp|/^[0-9]+$/|numeric regex|

### function list

|function name|arguments|response|description|
|---|---|---|---|
|constructor|replacing_element:Node Or String(dom id),player_content_object,player_set_event_function:function||constructor of class|
|playVideo|||play video for player|
|pauseVideo|||pause video for player|
|getCurrentTime||number(seconds)|get curent time for player|
|getDuration||number(seconds)|get duration for player|
|seekTo|number(seconds)||seek to time for player|
|setVolume|number(0-100)||set volume for player|
|mute|||mute for player|
|unMute|||unmute for player|
|isMuted||boolean|check mute status for player|
|getVolume||number(0-100)|get volume for player|
|getPlayerState||number|get player state<br>0->not playing only thumbnail<br>1->onloaded(include cue)<br>2->playing<br>3->paused<br>4->video ended|
|getTitle||string|get title for playing video|
|loadVideoById|Load_video_option_object||load video by id for player|
|cueVideoById|Load_video_option_object||cue video by id for player|