#!/bin/bash

# iframe_api/bilibili.tsに型宣言を追加
sed -i '/class mep_bilibili{/a\
    player: any;\
    play_control_wrap: any;\
    front_error_code: any;\
    loading: any;\
    before_mute_volume: any;\
    content_width: any;\
    content_height: any;\
    videoid: any;\
    original_replacing_element: any;\
    player_set_event: any;\
    seek_time: any;\
    seek_time_used: any;\
    noextention_count_stop: any;\
    state: any;\
    apicache: any;\
    no_extention_pause: any;\
    startSeconds: any;\
    innerStartSeconds: any;\
    autoplay_flag: any;\
    displayCommentMode: any;\
    fastload: any;\
    no_extention_estimate_stop: any;\
    play_start_time: any;\
    play_start_count_interval: any;\
    endSeconds: any;\
    end_point_observe: any;\
    custom_state: any;\
    estimate_time: any;' iframe_api/bilibili.ts

# iframe_api/soundcloud.tsに型宣言を追加
sed -i '/class mep_soundcloud{/a\
    player: any;\
    playerVars: any;\
    player_statusdata: any;\
    autoplay: any;\
    player_widget: any;\
    player_metadata: any;\
    before_mute_volume: any;\
    forse_pause: any;\
    first_seek_time: any;\
    endSeconds: any;\
    pause_sended: any;\
    interval: any;\
    previous_player_status: any;\
    retry_count: any;' iframe_api/soundcloud.ts

# iframe_api/niconico.tsに型宣言を追加
sed -i '/class mep_niconico{/a\
    state: any;\
    startSeconds: any;\
    player: any;\
    playerId: any;\
    autoplay_flag: any;\
    endSeconds: any;\
    displayCommentMode: any;' iframe_api/niconico.ts

echo "型宣言を追加しました"