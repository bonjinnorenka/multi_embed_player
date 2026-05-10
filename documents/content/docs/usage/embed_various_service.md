---
weight: 900
title: "Embed_various_service"
description: ""
icon: "article"
date: "2023-11-04T14:33:32+09:00"
lastmod: "2023-11-04T14:33:32+09:00"
draft: false
toc: true
---

<!--load embed api-->
<script src="https://cdn.jsdelivr.net/npm/multi_embed_player@v3/dist/multi_embed_player.js"></script>
<style>
    multi-embed-player{
        width: 480px;
        height: 270px;
        max-width: 100%;
    }
</style>

## Support service list

- youtube
- bilibili
- nicovideo
- soundcloud
- applemusic

## Embed various service

### Youtube

```html
<multi-embed-player videoid="_NC_pqMt5rY" service="youtube"></multi-embed-player>
```

<!--live demo-->
<multi-embed-player videoid="_NC_pqMt5rY" service="youtube"></multi-embed-player>

### Bilibili

```html
<multi-embed-player videoid="BV19e411Q7Lr" service="bilibili"></multi-embed-player>
```

<!--live demo-->
<multi-embed-player videoid="BV19e411Q7Lr" service="bilibili"></multi-embed-player>

### Nicovideo

```html
<multi-embed-player videoid="sm9" service="niconico"></multi-embed-player>
```

<!--live demo-->
<multi-embed-player videoid="sm9" service="niconico"></multi-embed-player>

### Soundcloud

```html
<multi-embed-player videoid="tkrism/reflection-feat-nicamoq" service="soundcloud"></multi-embed-player>
```

<!--live demo-->
<multi-embed-player videoid="tkrism/reflection-feat-nicamoq" service="soundcloud"></multi-embed-player>

### Apple Music

Apple Music uses MusicKit JS. The player API gate must be configured to issue developer tokens.

```html
<multi-embed-player videoid="2037093406" service="applemusic" kind="songs" storefront="jp"></multi-embed-player>
```

For v1, only `kind="songs"` is playable. `storefront` is optional and defaults to the API gate default.

## Error redirect

Sometimes video may delete from a service, but you can redirect to other video.

### register redirect video

```html
<multi-embed-player videoid="sm9" service="niconico" subVideoid="Ft1oytmXg3Y" subService="youtube"></multi-embed-player>
```

<multi-embed-player videoid="sm9" service="niconico" subVideoid="Ft1oytmXg3Y" subService="youtube"></multi-embed-player>

In this way if firest video was not found, then redirect to second video.

Also if first video was not found, then show second video thumbnails instead of first video thumbnails.
