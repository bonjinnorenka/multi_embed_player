---
weight: 5000
title: "HTML"
description: ""
icon: "article"
date: "2023-11-04T15:53:41+09:00"
lastmod: "2023-11-04T15:53:41+09:00"
draft: false
toc: true
---

## multi-embed-player attribute list

This is only listed original or unique value.

| attribute name | type   | required | default value | description     |
| -------------- | ------ | -------- | ------------- | --------------- |
| videoid        | string | true     | null          | video id        |
| service        | string | true     | null          | service name    |
| subVideoid     | string | false    | null          | sub video id if use need subService    |
| subService     | string | false    | null          | sub service name|
| type           | string | false    | embed         | embed or player or thumbnail-click |
| follow_GDPR    | boolen | false    | false         | follow GDPR or not     |
| img_url        | string | false    | null          | image url it use instead of video id thumbnail       |
| picture_tag   | string of HTML | false    | null          | picture tag inner content it use instead of video id thumbnail       |
| for            | string | false    | null          | player id to play valid only thumbnail-click       |
