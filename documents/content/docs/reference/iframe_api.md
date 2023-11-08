---
weight: 9000
title: "Iframe_api"
description: ""
icon: "article"
date: "2023-11-03T19:34:04+09:00"
lastmod: "2023-11-03T19:34:04+09:00"
draft: false
toc: true
---

## url_proxy

### API endpoint

```URL
GET ?route=url_proxy&url=${Fetch URL}
```

Fetch URL should encode

In javascript, you should use encodeURIComponent to encode Fetch URL.

### Example request

```url
GET ?route=url_proxy&url=https%3A%2F%2Fpokeapi.co%2Fapi%2Fv2%2Fpokemon%2F1
```

Example of fetch resorce using url_proxy,fetch [pokemon API](https://pokeapi.co/)

## Youtube API

### API endpoint

```URL
GET ?route=youtube&videoid=${video id(11 characters)}
```

{{< alert context="info" text="This api depend on youtube oembed api" />}}

### Query parameter

{{< table "table-responsive" >}}

| Parameter Name | Required | Type   | Description                                                                  |
| -------------- | -------- | ------ | ---------------------------------------------------------------------------- |
| route          | Yes      | String | The route to the specific API endpoint. Must be **youtube**                  |
| videoid        | Yes      | String | The ID of the video to retrieve details for.                                 |
| image_base64   | No       | Number | If set to 1, the response will include a base64 encoded image. Default is 0. |

{{< /table >}}

### Success response

{{< tabs tabTotal="2">}} {{% tab tabName="JSON" %}}

```URL
GET ?route=youtube&videoid=_NC_pqMt5rY&image_base64=1
```

```JSON
{
  "title": "アンドロイドガール - DECO*27 / Covered 風真いろは×AZKi",
  "author_name": "Iroha ch. 風真いろは - holoX -",
  "author_url": "https://www.youtube.com/@kazamairoha",
  "type": "video",
  "height": 113,
  "width": 200,
  "version": "1.0",
  "provider_name": "YouTube",
  "provider_url": "https://www.youtube.com/",
  "thumbnail_height": 360,
  "thumbnail_width": 480,
  "thumbnail_url": "https://i.ytimg.com/vi/_NC_pqMt5rY/hqdefault.jpg",
  "html": "<iframe width=\"200\" height=\"113\" src=\"https://www.youtube.com/embed/_NC_pqMt5rY?feature=oembed\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" allowfullscreen title=\"アンドロイドガール - DECO*27 / Covered 風真いろは×AZKi\"></iframe>",
  "image_base64": "<BASE64 ENCODED JPEG IMAGE DATA>"
}
```

{{% /tab %}} {{% tab tabName="JSDOC" %}}

```JS
/**
 * @typedef {Object} youtube_iframe_api
 * @property {string} title - The title of the YouTube video.
 * @property {string} author_name - The name of the author of the video.
 * @property {string} author_url - The URL of the author's YouTube channel.
 * @property {string} type - The type of the response like Video.
 * @property {number} height - The height in pixels required to display the HTML.
 * @property {number} width - The width in pixels required to display the HTML.
 * @property {string} version - The version of the oEmbed protocol (must 1.0).
 * @property {string} provider_name - The name of the oEmbed provider.
 * @property {string} provider_url - The URL of the oEmbed provider.
 * @property {number} thumbnail_height - The height of the video thumbnail.
 * @property {number} thumbnail_width - The width of the video thumbnail.
 * @property {string} thumbnail_url - The URL of the video thumbnail.
 * @property {string} html - The HTML required to embed a video.
 * @property {string} image_base64 - The base64 image (only show image_base64 parameter to 1).
 */
```

{{% /tab %}} {{< /tabs >}}

### Failed response

```JSON
{
  "title": "",
  "status": "failed notfound?"
}
```

## Niconico API

### API Endpoint

```URL
GET ?route=niconico&videoid=${video id}
```

This API response depend on niconico return ones, so sometimes change from this or send error.(23/11/3)

### Query parameter

{{< table "table-responsive" >}}

| Parameter Name | Required | Type   | Description                                                                  |
| -------------- | -------- | ------ | ---------------------------------------------------------------------------- |
| route          | Yes      | String | The route to the specific API endpoint. Must be **niconico**                 |
| videoid        | Yes      | String | The ID of the video to retrieve details for.                                 |
| image_base64   | No       | Number | If set to 1, the response will include a base64 encoded image. Default is 0. |

{{< /table >}}

### Success response

{{< tabs tabTotal="2">}} {{% tab tabName="JSON" %}}

```URL
GET ?route=niconico&videoid=sm9&image_base64=1
```

```JSON
{
  "thumbnail_url": "https://nicovideo.cdn.nimg.jp/thumbnails/9/9",
  "image_base64": "<BASE64 ENCODED JPEG IMAGE DATA>",
  "status": "success",
  "videoid": "sm9",
  "title": "新・豪血寺一族 -煩悩解放 - レッツゴー！陰陽師",
  "description": "レッツゴー！陰陽師（フルコーラスバージョン）",
  "length": "5:20",
  "view_count": "21782451",
  "comment_count": "5422770",
  "mylist_count": "180815",
  "publish_time": "2007-03-06T00:33:00+09:00",
  "embedable": "1",
  "genre": "未設定"
}
```

{{< table "table-responsive" >}}

| Parameter Name | Parameter Description                                                     |
| -------------- | ------------------------------------------------------------------------- |
| thumbnail_url  | The URL of the NicoNico video thumbnail                                   |
| image_base64   | The base64 encoded image data (only shown if image_base64 parameter is 1) |
| status         | The status of the request (success or failed)                             |
| videoid        | The ID of the NicoNico video                                              |
| title          | The title of the NicoNico video                                           |
| description    | The description of the NicoNico video                                     |
| length         | The length of the NicoNico video                                          |
| view_count     | The view count of the NicoNico video                                      |
| comment_count  | The comment count of the NicoNico video                                   |
| mylist_count   | The mylist count of the NicoNico video                                    |
| publish_time   | The publish time of the NicoNico video(ISO 8601 String)                   |
| embedable      | Whether the NicoNico video is embeddable or not                           |
| genre          | The genre of the NicoNico video                                           |

{{< /table >}}

{{% /tab %}} {{% tab tabName="JSDOC" %}}

```JS
/**
 * @typedef {Object} NicoNicoData
 * @property {string} thumbnail_url - The URL of the NicoNico video thumbnail.
 * @property {string} image_base64 - The base64 image (only show image_base64 parameter to 1).
 * @property {string} status - The status of the video.
 * @property {string} videoid - The ID of the video.
 * @property {string} title - The title of the video.
 * @property {string} description - The description of the video.
 * @property {string} length - The length of the video.
 * @property {string} view_count - The view count of the video.
 * @property {string} comment_count - The comment count of the video.
 * @property {string} mylist_count - The mylist count of the video.
 * @property {string} publish_time - The publish time of the video.
 * @property {string} embedable - Whether the video is embeddable or not.
 * @property {string} genre - The genre of the video.
 */
```

{{% /tab %}} {{< /tabs >}}

### Failed request

```JSON
{
  "status": "invalid videoid",
  "thumbnail_url": ""
}
```

## Bilibili API

### API endpoint

```URL
GET ?route=bilibili&videoid=${BVID}
```

### Query parameter

{{< table "table-responsive" >}}

| Parameter Name | Required | Type   | Description                                                                  |
| -------------- | -------- | ------ | ---------------------------------------------------------------------------- |
| route          | Yes      | String | The route to the specific API endpoint. Must be **bilibili**                 |
| videoid        | Yes      | String | The ID of the video to retrieve details for.  Must be **BVID** not use AVID  |
| image_base64   | No       | Number | If set to 1, the response will include a base64 encoded image. Default is 0. |

{{< /table >}}

### Sucess Response

{{< tabs tabTotal="2">}} {{% tab tabName="JSON" %}}

```URL
?route=bilibili&videoid=BV18B4y1o7iA&image_base64=1
```

```JSON
  {
  "code": 0,
  "message": "0",
  "ttl": 1,
  "data": {
    "bvid": "BV18B4y1o7iA",
    "aid": 577398422,
    "videos": 1,
    "tid": 25,
    "tname": "MMD·3D",
    "copyright": 1,
    "pic": "http://i2.hdslb.com/bfs/archive/6a14b7e43765d6114e03712a6bf08c61b7a66c5e.jpg",
    "title": "【MMD/白粥nina】帝国少女",
    "pubdate": 1697793913,
    "ctime": 1697793913,
    "desc": "[ CREDITS ]\n\n[ MODEL ]\n模型所属：白粥nina\n模型制作：萧容与\n物理绑定：FixEll\n\n[ MOTION \\ CAMERA ]\nじゅんこだ\nhttp://www.nicovideo.jp/watch/sm33682991\n予沉7\nhttps://www.bilibili.com/video/av32301048\n\n[ STAGE ]\nゆづき-(万年寝不足-別館)\n\n[ EFFECTS ]\nRui\\そぼろ\\ikeno\\おたもん\\ビームマンP\\めめ\\化身バレッタ\\下っ腹Ｐ\\角砂糖\\Winglayer\\ましまし\\桜庭リョウ\\のりたまP\\かき\\みりあす\\もこたろ\n\n[ SONG ]\nR Sound Design - 帝国少女 ft.初音ミク\nhttp://www.nicovideo.jp/watch/sm30788596\nCover by Sawako碎花",
    "desc_v2": [
      {
        "raw_text": "[ CREDITS ]\n\n[ MODEL ]\n模型所属：白粥nina\n模型制作：萧容与\n物理绑定：FixEll\n\n[ MOTION \\ CAMERA ]\nじゅんこだ\nhttp://www.nicovideo.jp/watch/sm33682991\n予沉7\nhttps://www.bilibili.com/video/av32301048\n\n[ STAGE ]\nゆづき-(万年寝不足-別館)\n\n[ EFFECTS ]\nRui\\そぼろ\\ikeno\\おたもん\\ビームマンP\\めめ\\化身バレッタ\\下っ腹Ｐ\\角砂糖\\Winglayer\\ましまし\\桜庭リョウ\\のりたまP\\かき\\みりあす\\もこたろ\n\n[ SONG ]\nR Sound Design - 帝国少女 ft.初音ミク\nhttp://www.nicovideo.jp/watch/sm30788596\nCover by Sawako碎花",
        "type": 1,
        "biz_id": 0
      }
    ],
    "state": 0,
    "duration": 256,
    "rights": {
      "bp": 0,
      "elec": 0,
      "download": 1,
      "movie": 0,
      "pay": 0,
      "hd5": 1,
      "no_reprint": 1,
      "autoplay": 1,
      "ugc_pay": 0,
      "is_cooperation": 0,
      "ugc_pay_preview": 0,
      "no_background": 0,
      "clean_mode": 0,
      "is_stein_gate": 0,
      "is_360": 0,
      "no_share": 0,
      "arc_pay": 0,
      "free_watch": 0
    },
    "owner": {
      "mid": 3493284211067530,
      "name": "白粥nina",
      "face": "https://i1.hdslb.com/bfs/face/d867d7985e7db7c2446c5a627abf2e55299ee407.jpg"
    },
    "stat": {
      "aid": 577398422,
      "view": 53344,
      "danmaku": 31,
      "reply": 217,
      "favorite": 2054,
      "coin": 951,
      "share": 115,
      "now_rank": 0,
      "his_rank": 0,
      "like": 8600,
      "dislike": 0,
      "evaluation": "",
      "argue_msg": "",
      "vt": 0
    },
    "dynamic": "答应妈咪们的帝国少女来啦！",
    "cid": 1305451191,
    "dimension": {
      "width": 1920,
      "height": 1080,
      "rotate": 0
    },
    "premiere": null,
    "teenage_mode": 0,
    "is_chargeable_season": false,
    "is_story": false,
    "is_upower_exclusive": false,
    "is_upower_play": false,
    "enable_vt": 0,
    "vt_display": "",
    "no_cache": false,
    "pages": [
      {
        "cid": 1305451191,
        "page": 1,
        "from": "vupload",
        "part": "【MMD/白粥nina】帝国少女",
        "duration": 256,
        "vid": "",
        "weblink": "",
        "dimension": {
          "width": 1920,
          "height": 1080,
          "rotate": 0
        },
        "first_frame": "http://i1.hdslb.com/bfs/storyff/n231020sahwhfp3eq52kd2tokzchlwnx_firsti.jpg"
      }
    ],
    "subtitle": {
      "allow_submit": false,
      "list": []
    },
    "is_season_display": false,
    "user_garb": {
      "url_image_ani_cut": ""
    },
    "honor_reply": {},
    "like_icon": "",
    "need_jump_bv": false,
    "disable_show_up_info": false
  },
  "image_base64": "<BASE64 ENCODED JPEG IMAGE DATA>"
}
```

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| code           | Number | The status code of the response. 0 indicates success.                       |
| message        | String | A message associated with the response code.                                |
| ttl            | Number | Time to live. It's a method to determine the lifespan or lifetime of data.  |
| data           | Object | Contains the actual data of the response.                                   |
| image_base64|String|Base 64 Image of video thumbnail|

{{< /table >}}

data Object

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| bvid           | String | The ID of the video.                                                        |
| aid            | Number | The alternative ID of the video.                                            |
| videos         | Number | The number of videos.                                                       |
| tid            | Number | The ID of the category the video belongs to.                                |
| tname          | String | The name of the category the video belongs to.                              |
| copyright      | Number | The copyright status of the video.                                          |
| pic            | String | The URL of the video thumbnail.                                             |
| title          | String | The title of the video.                                                     |
| pubdate        | Number | The publication date of the video in Unix timestamp.                        |
| ctime          | Number | The creation time of the video in Unix timestamp.                           |
| desc           | String | The description of the video.                                               |
| desc_v2        | Array  | An array of objects containing the raw text of the description and its type.|
| state          | Number | The state of the video.                                                     |
| attribute      | Number | The attribute of the video.                                                 |
| duration       | Number | The duration of the video in seconds.                                       |
| rights         | Object | An object containing information about the rights of the video.             |
| owner          | Object | An object containing information about the owner of the video.              |
| stat           | Object | An object containing statistical information about the video.               |
| dynamic        | String | The dynamic of the video.                                                   |
| dimension      | Object | An object containing information about the video's dimensions.              |
| subtitle       | Object | An object containing information about the video's subtitles.               |
| pages          | Array  | An array of objects containing information about each page of the video.    |
| staff          | Array  | An array of objects containing information about the staff involved.        |

{{< /table >}}

desc_v2 array type

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| raw_text       | String | The raw text of the description.                                            |
| type           | Number | The type of the description.                                                |
| biz_id         | Number | The business ID associated with the description.                            |

{{< /table >}}

rights object

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| bp             | Number | Whether the video has bullet points.                                        |
| elec           | Number | Whether the video has electronic points.                                    |
| download       | Number | Whether the video can be downloaded.                                        |

{{< /table >}}

owner object

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| mid            | Number | The ID of the owner.                                                        |
| name           | String | The name of the owner.                                                      |
| face           | String | The URL of the owner's profile picture URL.                                     |

{{< /table >}}

stat object

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| view           | Number | The number of views the video has.                                          |
| danmaku        | Number | The number of danmaku (comments) the video has.                             |
| reply          | Number | The number of replies the video has.                                        |
| favorite       | Number | The number of times the video has been favorited.                           |
| coin           | Number | The number of coins given to the video.                                     |
| share          | Number | The number of times the video has been shared.                              |
| now_rank       | Number | The current rank of the video.                                              |
| his_rank       | Number | The historical highest rank of the video.                                   |
| like           | Number | The number of likes the video has.                                          |
| dislike        | Number | The number of dislikes the video has.                                       |

{{< /table >}}

subtitle object

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| allow_submit   | Boolean| Whether submission of subtitles is allowed.                                |
| list           | Array  | An array of objects containing information about each subtitle.             |

{{< /table >}}

list on subtitle object

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| id             | Number | The ID of the subtitle.                                                     |
| lan            | String | The language of the subtitle.                                               |
| subtitle_url   | String | The URL of the subtitle.                                                    |

{{< /table >}}

pages object

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| cid            | Number | The ID of the page.                                                         |
| page           | Number | The number of the page.                                                     |
| from           | String | The source of the page.                                                     |
| part           | String | The title of the page.                                                      |
| duration       | Number | The duration of the page in seconds.                                        |
| vid            | String | The video ID of the page.                                                   |
| weblink        | String | The web link of the page.                                                   |

{{< /table >}}

staff object

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| mid            | Number | The ID of the staff member.                                                 |
| title          | String | The title of the staff member.                                              |
| name           | String | The name of the staff member.                                               |
| face           | String | The URL of the staff member's profile picture.                              |
| official_verify| Object | An object containing information about the staff member's official status. |

{{< /table >}}

official_verify object

{{< table "table-responsive" >}}

| Parameter Name | Type   | Description                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------- |
| type           | Number | The type of the official verification.                                      |
| desc           | String | The description of the official verification.                               |

{{< /table >}}

{{% /tab %}} {{% tab tabName="JSDOC" %}}

```JS
/** @typedef {object} json
 * @property {number} code
 * @property {string} message
 * @property {number} ttl
 * @property {object} data
 * @property {string} data.bvid
 * @property {number} data.aid
 * @property {number} data.videos
 * @property {number} data.tid
 * @property {string} data.tname
 * @property {number} data.copyright
 * @property {string} data.pic
 * @property {string} data.title
 * @property {number} data.pubdate
 * @property {number} data.ctime
 * @property {string} data.desc
 * @property {object[]} data.desc_v2
 * @property {string} data.desc_v2.raw_text
 * @property {number} data.desc_v2.type
 * @property {number} data.desc_v2.biz_id
 * @property {number} data.state
 * @property {number} data.duration
 * @property {object} data.rights
 * @property {number} data.rights.bp
 * @property {number} data.rights.elec
 * @property {number} data.rights.download
 * @property {number} data.rights.movie
 * @property {number} data.rights.pay
 * @property {number} data.rights.hd5
 * @property {number} data.rights.no_reprint
 * @property {number} data.rights.autoplay
 * @property {number} data.rights.ugc_pay
 * @property {number} data.rights.is_cooperation
 * @property {number} data.rights.ugc_pay_preview
 * @property {number} data.rights.no_background
 * @property {number} data.rights.clean_mode
 * @property {number} data.rights.is_stein_gate
 * @property {number} data.rights.is_360
 * @property {number} data.rights.no_share
 * @property {number} data.rights.arc_pay
 * @property {number} data.rights.free_watch
 * @property {object} data.owner
 * @property {number} data.owner.mid
 * @property {string} data.owner.name
 * @property {string} data.owner.face
 * @property {object} data.stat
 * @property {number} data.stat.aid
 * @property {number} data.stat.view
 * @property {number} data.stat.danmaku
 * @property {number} data.stat.reply
 * @property {number} data.stat.favorite
 * @property {number} data.stat.coin
 * @property {number} data.stat.share
 * @property {number} data.stat.now_rank
 * @property {number} data.stat.his_rank
 * @property {number} data.stat.like
 * @property {number} data.stat.dislike
 * @property {string} data.stat.evaluation
 * @property {string} data.stat.argue_msg
 * @property {number} data.stat.vt
 * @property {string} data.dynamic
 * @property {number} data.cid
 * @property {object} data.dimension
 * @property {number} data.dimension.width
 * @property {number} data.dimension.height
 * @property {number} data.dimension.rotate
 * @property {null} data.premiere
 * @property {number} data.teenage_mode
 * @property {boolean} data.is_chargeable_season
 * @property {boolean} data.is_story
 * @property {boolean} data.is_upower_exclusive
 * @property {boolean} data.is_upower_play
 * @property {number} data.enable_vt
 * @property {string} data.vt_display
 * @property {boolean} data.no_cache
 * @property {object[]} data.pages
 * @property {number} data.pages.cid
 * @property {number} data.pages.page
 * @property {string} data.pages.from
 * @property {string} data.pages.part
 * @property {number} data.pages.duration
 * @property {string} data.pages.vid
 * @property {string} data.pages.weblink
 * @property {object} data.pages.dimension
 * @property {number} data.pages.dimension.width
 * @property {number} data.pages.dimension.height
 * @property {number} data.pages.dimension.rotate
 * @property {string} data.pages.first_frame
 * @property {object} data.subtitle
 * @property {boolean} data.subtitle.allow_submit
 * @property {} data.subtitle.list
 * @property {boolean} data.is_season_display
 * @property {object} data.user_garb
 * @property {string} data.user_garb.url_image_ani_cut
 * @property {string} data.like_icon
 * @property {boolean} data.need_jump_bv
 * @property {boolean} data.disable_show_up_info
 * @property {string} image_base64
 */
```

{{% /tab %}} {{< /tabs >}}

### Failed request

```JSON
{
  "code": -400,
  "message": "请求错误",
  "ttl": 1
}
```

## Soundcloud API

### API endpoint

```URL
GET ?route=soundcloud&videoid=${video id}
```

### Query parameter

{{< table "table-responsive" >}}

| Parameter Name | Required | Type   | Description                                                                  |
| -------------- | -------- | ------ | ---------------------------------------------------------------------------- |
| route          | Yes      | String | The route to the specific API endpoint. Must be **soundcloud**                 |
| videoid        | Yes      | String | The ID of the video to retrieve details for.  |
| image_base64   | No       | Number | If set to 1, the response will include a base64 encoded image. Default is 0. |
  
  {{< /table >}}

<br>

{{< alert context="info" text="This api depend on [soundcloud oembed api](https://developers.soundcloud.com/docs/oembed)" />}}

### Sucess Response

{{< tabs tabTotal="2">}} {{% tab tabName="JSON" %}}

```URL
GET ?route=soundcloud&videoid=tkrism/reflection-feat-nicamoq&image_base64=1
```

```JSON
{
  "version": 1,
  "type": "rich",
  "provider_name": "SoundCloud",
  "provider_url": "https://soundcloud.com",
  "height": 400,
  "width": "100%",
  "title": "Reflection (feat. nicamoq) by Yunomi",
  "description": "",
  "thumbnail_url": "https://i1.sndcdn.com/artworks-ZUi7PGOqJ8zRLaP4-zxfjcA-t500x500.jpg",
  "html": "<iframe width=\"100%\" height=\"400\" scrolling=\"no\" frameborder=\"no\" src=\"https://w.soundcloud.com/player/?visual=true&url=https%3A%2F%2Fapi.soundcloud.com%2Ftracks%2F1078906900&show_artwork=true\"></iframe>",
  "author_name": "Yunomi",
  "author_url": "https://soundcloud.com/tkrism",
  "image_base64": "<BASE64 ENCODED JPEG IMAGE DATA>",
}
```

{{< table "table-responsive" >}}

| Parameter Name | Parameter Description                                                     |
| -------------- | ------------------------------------------------------------------------- |
| version        | The version of the oEmbed protocol (must 1.0).                           |
| type           | The type of the response like rich.                                       |
| provider_name  | The name of the oEmbed provider.                                          |
| provider_url   | The URL of the oEmbed provider.                                           |
| height         | The height in pixels required to display the HTML.                        |
| width          | The width in pixels required to display the HTML.                         |
| title          | The title of the SoundCloud track.                                        |
| description    | The description of the SoundCloud track.                                  |
| thumbnail_url  | The URL of the SoundCloud track thumbnail.                                |
| html           | The HTML required to embed a SoundCloud track.                            |
| author_name    | The name of the author of the SoundCloud track.                           |
| author_url     | The URL of the author's SoundCloud profile.                               |
| image_base64   | The base64 image (only show image_base64 parameter to 1).                 |
  
{{< /table >}}

{{% /tab %}} {{% tab tabName="JSDOC" %}}

```JS
/**
 * @typedef {Object} soundcloud_iframe_api
 * @property {number} version - The version of the oEmbed protocol (must 1.0).
 * @property {string} type - The type of the response like rich.
 * @property {string} provider_name - The name of the oEmbed provider.
 * @property {string} provider_url - The URL of the oEmbed provider.
 * @property {number} height - The height in pixels required to display the HTML.
 * @property {number} width - The width in pixels required to display the HTML.
 * @property {string} title - The title of the SoundCloud track.
 * @property {string} description - The description of the SoundCloud track.
 * @property {string} thumbnail_url - The URL of the SoundCloud track thumbnail.
 * @property {string} html - The HTML required to embed a SoundCloud track.
 * @property {string} author_name - The name of the author of the SoundCloud track.
 * @property {string} author_url - The URL of the author's SoundCloud profile.
 * @property {string} image_base64 - The base64 image (only show image_base64 parameter to 1).
 */
```

{{% /tab %}} {{< /tabs >}}

### Failed response

```JSON
{
  "status": "error not found?"
}
```
