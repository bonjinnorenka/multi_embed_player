#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dtsPath = path.join(__dirname, 'dist', 'multi_embed_player.d.ts');

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