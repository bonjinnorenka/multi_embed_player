// Node.js環境用の型定義エクスポート
// これは外部プロジェクトでrequireできるように型のみをエクスポートします

module.exports = {
    // これらは実際の実装ではなく、型確認用のスタブです
    mep_playitem: class mep_playitem {
        constructor(service, videoid) {
            this.service = service;
            this.videoid = videoid;
            this.call_array = [];
        }
        toData() {
            return {
                service: this.service,
                videoId: this.videoid,
                call_array: this.call_array,
                call_index: 0
            };
        }
    },
    
    mep_parallel: class mep_parallel {
        constructor() {
            this.data = [];
        }
        parse() {}
    },
    
    mep_parallel_inner: class mep_parallel_inner {
        constructor(service, videoid) {
            this.service = service;
            this.videoid = videoid;
        }
    },
    
    // 関数のスタブ
    multi_embed_player_fetch_iframe_api: function() {},
    multi_embed_player_save_GDPR_status: function() {},
    multi_embed_player_GDPR_reviever: function() {},
    multi_embed_player_GDPR_accepted_all_back_down: function() {}
};