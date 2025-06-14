---
weight: 1100
title: "Embed_api"
description: ""
icon: "article"
date: "2023-11-04T15:15:14+09:00"
lastmod: "2023-11-04T15:15:14+09:00"
draft: false
toc: true
---

<!--load api-->
<script src="https://cdn.jsdelivr.net/npm/multi_embed_player@3/dist/multi_embed_player.js"></script>

<style>
    multi-embed-player{
        width: 480px;
        height: 270px;
        max-width: 100%;
    }
</style>

## Embed_api

multi_embed_player embed api can embed various service embed video to your website with one API.

This use for embed display element to load api.

## Example

```HTML
<!--define html display element-->
<multi-embed-player id="mep_player" type="player"></multi-embed-player>
<div style="display: flex;">
<button onclick="document.getElementById('mep_player').playVideo()">play</button>
<button onclick="document.getElementById('mep_player').pauseVideo()">pause</button>
<!--mute and unmute button-->
<button onclick="document.getElementById('mep_player').mute()">mute</button>
<button onclick="document.getElementById('mep_player').unMute()">unmute</button>
<!--sound volume range-->
<input type="range" min="0" max="100" value="100" oninput="document.getElementById('mep_player').setVolume(this.value)">
<!--seek to input box value max is not define seekTo button click-->
<input type="number" id="seek_to_input" value="0">
<button onclick="document.getElementById('mep_player').seekTo(document.getElementById('seek_to_input').value)">seekTo</button>
<!--under this getter function !sometimes! return promise-->
<!--print to console about currenttime-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').getCurrentTime())})()">get current time</button>
<!--print to console about duration-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').getDuration())})()">get duration</button>
<!--print to console about volume-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').getVolume())})()">get volume</button>
<!--print to console about player state-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').getPlayerState())})()">get player state</button>
<!--print mute status-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').isMuted())})()">is muted</button>
</div>
<div style="display: flex;">
    <!--load youtube video-->
    <input value="0ngyl5gbEQQ" type="text" placeholder="youtube video id" id="youtube_video_id">
    <button onclick="document.getElementById('mep_player').loadVideoById({'videoId':document.getElementById('youtube_video_id').value, service:'youtube'})">load youtube video</button>
</div>
<div style="display: flex;">
    <!--load niconico video-->
    <input type="text" placeholder="niconico video id" id="niconico_video_id">
    <button onclick="document.getElementById('mep_player').loadVideoById({'videoId':document.getElementById('niconico_video_id').value, service:'niconico'})">load niconico video</button>
</div>
<div style="display: flex;">
    <!--load bilibili video-->
    <input value="BV16K4y177HZ" type="text" placeholder="bilibili video id" id="bilibili_video_id">
    <button onclick="document.getElementById('mep_player').loadVideoById({'videoId':document.getElementById('bilibili_video_id').value, service:'bilibili'})">load bilibili video</button>
</div>
<div style="display: flex;">
    <!--load soundcloud video-->
    <input value="dada-qada/koisashi" type="text" placeholder="soundcloud video id" id="soundcloud_video_id">
    <button onclick="document.getElementById('mep_player').loadVideoById({'videoId':document.getElementById('soundcloud_video_id').value, service:'soundcloud'})">load soundcloud video</button>
</div>
```

<multi-embed-player id="mep_player" type="player"></multi-embed-player>

<div style="display: flex;">
<button onclick="document.getElementById('mep_player').playVideo()">play</button>
<button onclick="document.getElementById('mep_player').pauseVideo()">pause</button>
<!--mute and unmute button-->
<button onclick="document.getElementById('mep_player').mute()">mute</button>
<button onclick="document.getElementById('mep_player').unMute()">unmute</button>
<!--sound volume range-->
<input type="range" min="0" max="100" value="100" oninput="document.getElementById('mep_player').setVolume(this.value)">
<!--seek to input box value max is not define seekTo button click-->
<input type="number" id="seek_to_input" value="0">
<button onclick="document.getElementById('mep_player').seekTo(document.getElementById('seek_to_input').value)">seekTo</button>
<!--under this getter function !sometimes! return promise-->
<!--print to console about currenttime-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').getCurrentTime())})()">get current time</button>
<!--print to console about duration-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').getDuration())})()">get duration</button>
<!--print to console about volume-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').getVolume())})()">get volume</button>
<!--print to console about player state-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').getPlayerState())})()">get player state</button>
<!--print mute status-->
<button onclick="(async()=>{console.log(await document.getElementById('mep_player').isMuted())})()">is muted</button>
</div>
<div style="display: flex;">
    <!--load youtube video-->
    <input value="0ngyl5gbEQQ" type="text" placeholder="youtube video id" id="youtube_video_id">
    <button onclick="document.getElementById('mep_player').loadVideoById({'videoId':document.getElementById('youtube_video_id').value, service:'youtube'})">load youtube video</button>
</div>
<div style="display: flex;">
    <!--load niconico video-->
    <input type="text" placeholder="niconico video id" id="niconico_video_id">
    <button onclick="document.getElementById('mep_player').loadVideoById({'videoId':document.getElementById('niconico_video_id').value, service:'niconico'})">load niconico video</button>
</div>
<div style="display: flex;">
    <!--load bilibili video-->
    <input value="BV16K4y177HZ" type="text" placeholder="bilibili video id" id="bilibili_video_id">
    <button onclick="document.getElementById('mep_player').loadVideoById({'videoId':document.getElementById('bilibili_video_id').value, service:'bilibili'})">load bilibili video</button>
</div>
<div style="display: flex;">
    <!--load soundcloud video-->
    <input value="dada-qada/koisashi" type="text" placeholder="soundcloud video id" id="soundcloud_video_id">
    <button onclick="document.getElementById('mep_player').loadVideoById({'videoId':document.getElementById('soundcloud_video_id').value, service:'soundcloud'})">load soundcloud video</button>
</div>

## internal iframe API

### Example

This example [embed bilibili video](https://www.bilibili.com/video/BV16K4y177HZ/) and control it.

```HTML
<script src="https://cdn.jsdelivr.net/npm/multi_embed_player@3/dist/iframe_api/bilibili.js"></script>
<div style="width: 480px;height: 270px;display: block;position: relative;"><div id="mep_internal_description"></div></div>
<button id="pause_button">pause</button>
<script type="text/javascript">
    const mep_internal_description_element = document.getElementById('mep_internal_description');
    const player = new mep_bilibili('mep_internal_description', {
        'videoId': 'BV16K4y177HZ',
        'width': '480',
        'height': '270',
    });
    const pause_button = document.getElementById('pause_button');
    pause_button.onclick = () => {
        player.pauseVideo();
    }
</script>
```

<script src="https://cdn.jsdelivr.net/npm/multi_embed_player@3/dist/iframe_api/bilibili.js"></script>
<div style="width: 480px;height: 270px;display: block;position: relative;"><div id="mep_internal_description"></div></div>
<button id="pause_button">pause</button>
<script type="text/javascript">
    const mep_internal_description_element = document.getElementById('mep_internal_description');
    const player = new mep_bilibili('mep_internal_description', {
        'videoId': 'BV16K4y177HZ',
        'width': '480',
        'height': '270',
    });
    const pause_button = document.getElementById('pause_button');
    pause_button.onclick = () => {
        player.pauseVideo();
    }
</script>
