---
weight: 1400
title: "Custom Playlists"
description: "Learn how to create custom playlists with multi-embed-player and play videos sequentially."
icon: "article"
date: "2025-05-17T10:00:00+09:00"
lastmod: "2025-05-17T10:00:00+09:00"
draft: false
toc: true
---

<!--load api-->
<script src="https://cdn.jsdelivr.net/npm/multi_embed_player@v3/dist/multi_embed_player.js"></script>

<style>
    multi-embed-player {
        width: 480px;
        height: 270px;
        max-width: 100%;
    }
    multi-embed-player[type="thumbnail-click"] {
        min-width: 240px;
        min-height: 135px;
        margin-right: 10px; /* Space between thumbnails */
    }
    .playlist-container {
        display: flex;
        overflow-x: auto; /* Horizontal scroll for many thumbnails */
        padding-bottom: 10px;
    }
</style>

## Custom Playlist Feature

`multi-embed-player` allows you to create custom playlists to line up multiple videos for sequential playback.
This feature enables users to enjoy a series of video content without interruption.

### Basic Usage (HTML Attributes)

You can easily set up a playlist using HTML attributes.

1.  **Define the Player Element:**
    Place a `<multi-embed-player>` element with the `type="player"` attribute. This will be the main player that plays the videos. Assign it a unique `id`.

2.  **Define Playlist Item Elements:**
    Place `<multi-embed-player>` elements with the `type="thumbnail-click"` attribute. When clicked, these elements will add a video to the player specified by their `for` attribute.
    *   `service`: Specify the video service (e.g., `youtube`, `niconico`).
    *   `videoid`: The video ID from the respective service.
    *   `for`: The `id` of the target player element.
    *   `start` (optional): The start time for the video (in seconds).
    *   `end` (optional): The end time for the video (in seconds).

#### Example:

```html
<multi-embed-player id="myCustomPlayer" type="player"></multi-embed-player>

<p>↓ Click or right-click the thumbnails below to add to the playlist</p>
<div class="playlist-container">
    <multi-embed-player
        type="thumbnail-click"
        service="youtube"
        videoid="YOUTUBE_VIDEO_ID_1" <!-- Replace with an actual YouTube video ID -->
        for="myCustomPlayer"
        start="10"
        end="50">
    </multi-embed-player>

    <multi-embed-player
        type="thumbnail-click"
        service="niconico"
        videoid="sm9" <!-- Replace with an actual Niconico video ID -->
        for="myCustomPlayer">
    </multi-embed-player>

    <multi-embed-player
        type="thumbnail-click"
        service="youtube"
        videoid="YOUTUBE_VIDEO_ID_2" <!-- Replace with an actual YouTube video ID -->
        for="myCustomPlayer"
        start="30">
    </multi-embed-player>
</div>
```

**Behavior:**
*   Left-clicking a thumbnail (`type="thumbnail-click"` element) will immediately play the video in the player.
*   Right-clicking (context menu) a thumbnail will add the video to the end of the player's playlist.
*   The player will automatically play the next video in the playlist when the current video finishes.

#### Live Demo:

<multi-embed-player id="myCustomPlayer_Demo_EN" type="player"></multi-embed-player>

<p>↓ Click or right-click the thumbnails below to add to the playlist</p>
<div class="playlist-container">
    <multi-embed-player
        type="thumbnail-click"
        service="youtube"
        videoid="0ngyl5gbEQQ"
        for="myCustomPlayer_Demo_EN"
        start="10"
        end="50">
    </multi-embed-player>
    <multi-embed-player
        type="thumbnail-click"
        service="niconico"
        videoid="sm15885393"
        for="myCustomPlayer_Demo_EN">
    </multi-embed-player>
    <multi-embed-player
        type="thumbnail-click"
        service="youtube"
        videoid="H4C23eF_r2Q" 
        for="myCustomPlayer_Demo_EN"
        start="30">
    </multi-embed-player>
</div>

### Playlist Manipulation with JavaScript

You can also dynamically add video items to the playlist using JavaScript.

#### Steps:

1.  **Get the Player Element:**
    Retrieve the player element (the one with `type="player"`) using `document.getElementById()` or a similar method.

2.  **Create an `mep_playitem`:**
    Create an `mep_playitem` object containing the information for the video you want to add.
    The `mep_playitem` class is defined in the global scope by `multi_embed_player.js`.
    ```javascript
    const newItem = new mep_playitem('serviceName', 'videoID');
    newItem.startSeconds = 30; // Optional: Start time
    newItem.endSeconds = 120; // Optional: End time
    // newItem.subService = 'alternativeServiceName'; // Optional
    // newItem.subVideoid = 'alternativeVideoID'; // Optional
    ```

3.  **Add to Playlist:**
    `push` the data (converted by `newItem.toData()`) into the `playlist` array of the retrieved player element.

4.  **Dispatch Event (Playback Trigger):**
    Dispatch an `addPlaylist` event on the player element. This notifies the player of the change and, depending on its current state, may start playing the next video.

#### Example:

```html
<multi-embed-player id="jsPlayer" type="player"></multi-embed-player>
<button onclick="addYouTubeVideoJS()">Add YouTube Video (JS)</button>
<button onclick="addNiconicoVideoJS()">Add Niconico Video (JS)</button>

<script>
function addYouTubeVideoJS() {
    const playerElement = document.getElementById('jsPlayer');
    if (playerElement) {
        const newItem = new mep_playitem('youtube', 'dQw4w9WgXcQ'); // A well-known video ID
        newItem.startSeconds = 5;

        if (playerElement.playlist) {
            playerElement.playlist.push(newItem.toData());
            playerElement.dispatchEvent(new Event('addPlaylist'));
            console.log('YouTube video added to playlist.');
        } else {
            console.error('Playlist property not found.');
        }
    } else {
        console.error('Player element not found.');
    }
}

function addNiconicoVideoJS() {
    const playerElement = document.getElementById('jsPlayer');
    if (playerElement) {
        const newItem = new mep_playitem('niconico', 'sm9'); // A classic video ID
        // newItem.startSeconds = 10;

        if (playerElement.playlist) {
            playerElement.playlist.push(newItem.toData());
            playerElement.dispatchEvent(new Event('addPlaylist'));
            console.log('Niconico video added to playlist.');
        } else {
            console.error('Playlist property not found.');
        }
    } else {
        console.error('Player element not found.');
    }
}
</script>
```

#### Live Demo (JavaScript):

<multi-embed-player id="jsPlayer_Demo_EN" type="player"></multi-embed-player>
<button onclick="addYouTubeVideoJS_Demo_EN()">Add YouTube Video (JS)</button>
<button onclick="addNiconicoVideoJS_Demo_EN()">Add Niconico Video (JS)</button>

<script>
function addYouTubeVideoJS_Demo_EN() {
    const playerElement = document.getElementById('jsPlayer_Demo_EN');
    if (playerElement) {
        const newItem = new mep_playitem('youtube', 'dQw4w9WgXcQ');
        newItem.startSeconds = 5;

        if (playerElement.playlist) {
            playerElement.playlist.push(newItem.toData());
            playerElement.dispatchEvent(new Event('addPlaylist'));
            alert('YouTube video added to playlist.');
        } else {
            alert('Playlist property not found.');
        }
    } else {
        alert('Player element not found.');
    }
}

function addNiconicoVideoJS_Demo_EN() {
    const playerElement = document.getElementById('jsPlayer_Demo_EN');
    if (playerElement) {
        const newItem = new mep_playitem('niconico', 'sm9');

        if (playerElement.playlist) {
            playerElement.playlist.push(newItem.toData());
            playerElement.dispatchEvent(new Event('addPlaylist'));
            alert('Niconico video added to playlist.');
        } else {
            alert('Playlist property not found.');
        }
    } else {
        alert('Player element not found.');
    }
}
</script>

### Notes
*   When using `type="thumbnail-click"`, ensure a corresponding `type="player"` element exists on the page and its `id` is correctly referenced by the `for` attribute.
*   When manipulating via JavaScript, ensure your script runs after `multi_embed_player.js` has loaded and the `mep_playitem` class is available.
*   Specify video IDs and service names accurately. If you specify a non-existent video or an unsupported service, it will not work as expected.
*   Even with the same video ID and service, if the start or end times differ, they will be treated as separate items in the playlist. Internally, for the same service and video ID, the player will try to use lightweight methods like `seekTo` to change the playback position whenever possible, but this depends on the implementation of the player for each specific service.