#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dtsPath = path.join(__dirname, 'dist', 'multi_embed_player.d.ts');
const jsPath = path.join(__dirname, 'dist', 'multi_embed_player.js');

// .d.ts ファイルの処理
if (fs.existsSync(dtsPath)) {
    let content = fs.readFileSync(dtsPath, 'utf8');
    
    // 既にexport文が存在するかチェック
    if (!content.includes('// ES Modules support')) {
        // export文を追加
        const exportStatement = `
// ES Modules support
export { 
  multi_embed_player, 
  ServiceType, 
  PlaylistItem, 
  mep_playitem, 
  mep_parallel, 
  mep_parallel_inner,
  multi_embed_player_fetch_iframe_api,
  multi_embed_player_save_GDPR_status,
  multi_embed_player_GDPR_reviever,
  multi_embed_player_GDPR_accepted_all_back_down,
  multi_embed_player_css
};
export as namespace MultiEmbedPlayer;`;

        // ソースマップの行の前に挿入
        content = content.replace('//# sourceMappingURL=', exportStatement + '\n//# sourceMappingURL=');
        
        fs.writeFileSync(dtsPath, content);
        console.log('✓ Export文を multi_embed_player.d.ts に追加しました');
    } else {
        console.log('✓ Export文は既に存在します');
    }
} else {
    console.error('✗ multi_embed_player.d.ts が見つかりません');
    process.exit(1);
}

// .js ファイルの処理
if (fs.existsSync(jsPath)) {
    let jsContent = fs.readFileSync(jsPath, 'utf8');
    
    // 既存の不適切な追加を削除
    if (jsContent.includes('module.exports = { multi_embed_player')) {
        jsContent = jsContent.replace(/module\.exports = \{ multi_embed_player[^}]+\};\s*$/g, '');
        console.log('✓ 既存の不適切なexportを削除しました');
    }
    
    // 既にexport文が存在するかチェック
    if (!jsContent.includes('// CommonJS/ES Modules export')) {
        // JavaScriptファイルにも条件付きexportを追加
        const jsExportStatement = `
// CommonJS/ES Modules export
if (typeof module !== 'undefined' && module.exports && typeof window === 'undefined') {
    // Node.js環境でのみexport（ブラウザでは実行しない）
    module.exports = {
        mep_playitem: typeof mep_playitem !== 'undefined' ? mep_playitem : class {},
        mep_parallel: typeof mep_parallel !== 'undefined' ? mep_parallel : class {},
        mep_parallel_inner: typeof mep_parallel_inner !== 'undefined' ? mep_parallel_inner : class {},
        multi_embed_player_fetch_iframe_api: typeof multi_embed_player_fetch_iframe_api !== 'undefined' ? multi_embed_player_fetch_iframe_api : function(){},
        multi_embed_player_save_GDPR_status: typeof multi_embed_player_save_GDPR_status !== 'undefined' ? multi_embed_player_save_GDPR_status : function(){},
        multi_embed_player_GDPR_reviever: typeof multi_embed_player_GDPR_reviever !== 'undefined' ? multi_embed_player_GDPR_reviever : function(){},
        multi_embed_player_GDPR_accepted_all_back_down: typeof multi_embed_player_GDPR_accepted_all_back_down !== 'undefined' ? multi_embed_player_GDPR_accepted_all_back_down : function(){}
    };
}`;

        // ソースマップの行の前に挿入
        jsContent = jsContent.replace('//# sourceMappingURL=', jsExportStatement + '\n//# sourceMappingURL=');
        
        fs.writeFileSync(jsPath, jsContent);
        console.log('✓ 条件付きExport文を multi_embed_player.js に追加しました');
    } else {
        console.log('✓ JavaScriptのExport文は既に存在します');
    }
} else {
    console.error('✗ multi_embed_player.js が見つかりません');
    process.exit(1);
}