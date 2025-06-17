---
weight: 1300
title: "Thumbnail_click"
description: ""
icon: "article"
date: "2023-11-04T16:05:19+09:00"
lastmod: "2023-11-04T16:05:19+09:00"
draft: false
toc: true
---

<!--load api-->

<script src="https://cdn.jsdelivr.net/npm/multi_embed_player@v3/dist/multi_embed_player.js"></script>

<style>
    multi-embed-player{
        width: 480px;
        height: 270px;
        max-width: 100%;
    }
    multi-embed-player[type="thumbnail-click"] {
        min-width: 240px;
        min-height: 135px;
    }
</style>

## Thumbnail click

Thumbnail click is suitable for video list page.

### Example

```html
<style>
    multi-embed-player[type="thumbnail-click"] {
        min-width: 240px;
        min-height: 135px;
    }
</style>
<multi-embed-player id="mep_player" type="player"></multi-embed-player>
<div style="display:flex;overflow-x:scroll">
<multi-embed-player videoid="H4C23eF_r2Q" service="youtube" type="thumbnail-click" for="mep_player"></multi-embed-player>
<multi-embed-player videoid="Xl6gqwcLyPg" service="youtube" type="thumbnail-click" for="mep_player"></multi-embed-player>
<multi-embed-player videoid="BV1xu4y1m7bi" service="bilibili" type="thumbnail-click" for="mep_player"></multi-embed-player>
<multi-embed-player videoid="8izwhpwkfuor/hop" service="soundcloud" type="thumbnail-click" for="mep_player"></multi-embed-player>
</div>
```

<!--live demo-->
<multi-embed-player id="mep_player" type="player"></multi-embed-player>
<div style="display:flex;overflow-x:scroll">
<multi-embed-player videoid="H4C23eF_r2Q" service="youtube" type="thumbnail-click" for="mep_player"></multi-embed-player>
<multi-embed-player videoid="Xl6gqwcLyPg" service="youtube" type="thumbnail-click" for="mep_player"></multi-embed-player>
<multi-embed-player videoid="BV1xu4y1m7bi" service="bilibili" type="thumbnail-click" for="mep_player"></multi-embed-player>
<multi-embed-player videoid="8izwhpwkfuor/hop" service="soundcloud" type="thumbnail-click" for="mep_player"></multi-embed-player>
</div>
