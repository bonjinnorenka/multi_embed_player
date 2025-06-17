# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm install

# Build TypeScript files to dist/
npm run build

# Development mode with file watching
npm run dev

# Lint TypeScript files
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

## Architecture

This is a TypeScript multi-service video player library that supports:
- YouTube
- Bilibili  
- SoundCloud
- Niconico

### Key Files Structure

- `multi_embed_player.ts` - Main player class and core functionality
- `types.ts` - Shared TypeScript type definitions
- `iframe_api/` - Service-specific iframe API implementations
  - `youtube.ts`, `bilibili.ts`, `soundcloud.ts`, `niconico.ts`
  - `index.ts` - Exports all player classes and types
- `dist/` - Compiled JavaScript output directory
- `player_api_gate/` - API gateway services (Cloudflare Workers)
- `browserExtention/` - Browser extension implementations

### Build System

- TypeScript compilation outputs to `dist/` directory
- Main entry point: `dist/multi_embed_player.js`
- Type definitions: `dist/multi_embed_player.d.ts`
- Source maps and declaration maps are generated
- Module system: ES2020 with Node.js resolution

### Development Workflow

Always run `npm run build` after TypeScript changes to update the compiled output. The library is published with the compiled JavaScript files, not the TypeScript source.

## TypeScript コンパイル時のクラス名保持について

TypeScript コンパイル時に `multi_embed_player.iframe_api_class[this.service]` が `_a.iframe_api_class[this.service]` になる問題への対処法：

### 問題
- `tsconfig.json` で `"module": "none"` 設定の場合、TypeScript コンパイラがクラス名を最小化
- `multi_embed_player` が `_a` に変換され、実行時にクラス参照が失われる

### 解決方法
1. グローバル変数へのクラス参照保存：
   ```typescript
   // ファイル末尾に追加
   (window as any).multi_embed_player = multi_embed_player;
   ```

2. コード内でのグローバル参照使用：
   ```typescript
   // 修正前
   this.player = new multi_embed_player.iframe_api_class[this.service](...);
   
   // 修正後  
   this.player = new (window as any).multi_embed_player.iframe_api_class[this.service](...);
   ```

3. iframe_api_loader内でも同様に修正：
   ```typescript
   // 修正前
   multi_embed_player.iframe_api_class["youtube"] = mep_youtube;
   
   // 修正後
   (window as any).multi_embed_player.iframe_api_class["youtube"] = mep_youtube;
   ```

これによりコンパイル後も `multi_embed_player.iframe_api_class` の形でクラス名が保持される。