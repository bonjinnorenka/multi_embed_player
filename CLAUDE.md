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