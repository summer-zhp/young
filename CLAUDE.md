# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**打工人治愈所** - A WeChat Mini Program for workplace wellness/relaxation. Native WeChat Mini Program with WeChat Cloud Development (CloudBase) backend. No cross-platform frameworks (no UniApp, Taro, etc.).

## Development Environment

- **IDE**: WeChat Developer Tools (微信开发者工具)
- **AppID**: `wxce0ba037399cd9cc`
- **Cloud Environment**: `cloud1-2gpreb4e2dc05acb`
- **Base Library**: 3.14.3
- **UI Library**: TDesign Mini Program (`tdesign-miniprogram`)
- **NPM Build**: Uses `packNpmRelationList` pointing to `tdesign-miniprogram` in `miniprogram_npm`

### Key Commands

- No CLI build/test commands. All development and previewing happens in WeChat Developer Tools.
- NPM packages: `npm install` then build NPM in WeChat Developer Tools (工具 → 构建 npm)
- Cloud function deployment: Right-click function in DevTools → 上传并部署
- Initialize data: Call `initData` cloud function from DevTools console

## Architecture

### Tab Bar Structure (4 tabs)

| Tab | Page | Purpose |
|-----|------|---------|
| 治愈 | `pages/index/index` | Daily healing content display |
| 放松 | `pages/toolbox/toolbox` | Relaxation tools (focus timer, bubble pop, tree hole, LED, decision wheel) |
| 工具箱 | `pages/toolkit/toolkit` | Utility tools (image2pdf, QR code, image compressor, signature, vault, grid-cutter) |
| 我的 | `pages/profile/profile` | User profile, favorites, stats |

### Cloud Functions (`cloudfunctions/`)

Each function has its own directory with `index.js` and `package.json`. Key categories:

- **User**: `login`, `getUserInfo`, `getUserStats`, `updateUserAvatar`, `updateUserJob`
- **Content**: `getDailyContent`, `getContentList`
- **Favorites**: `addToFavorites`, `getUserFavorites`, `removeFromFavorites`
- **Focus/Mood**: `recordFocus`, `recordMood`
- **Secrets Vault**: `encryptSecret`, `decryptSecret`, `getSecrets`, `saveSecret`, `deleteSecret`
- **Decision Wheel**: `getTurntables`, `saveTurntable`, `updateTurntable`, `deleteTurntable`, `saveSpinResult`
- **Tools**: `image2pdf`, `generateImage-a5aQFM`
- **AI**: `agent-treehole-3ggcbhk2054e8099`, `callHunyuan`
- **Setup**: `initData`, `getData`

Cloud functions use `wx-server-sdk`, init with `cloud.DYNAMIC_CURRENT_ENV`, and always verify OPENID via `cloud.getWXContext()`.

### Feature Flags

Environment variables in cloud functions control feature visibility (see `cloudfunctions/ENV_CONFIG.md`):
- `TREE_HOLE_ENABLED` - tree hole chat feature
- `CAPTION_IMAGE_ENABLED` - caption image generation

These are fetched at app launch via `getAppConfig` and stored in `app.globalData`.

### Global State (`app.js`)

- `globalData.userInfo` - user info with openid
- `globalData.isReleaseVersion` - controls feature visibility (checks `envVersion`)
- `requireLogin()` - gate for protected features, redirects to profile tab
- Version update handling via `wx.getUpdateManager()`

### Database Collections

MongoDB-like cloud database. Key collections:
- `healing_content` - healing quotes/articles
- `users` - user profiles with auto-generated "打工人XXX号" nicknames
- `user_favorites` - saved content
- `focus_records` - focus timer history
- `mood_records` - mood tracking
- `global_config` - counters and settings

### Design System (`styles/theme.wxss`)

CSS custom properties define the full design system. Colors use `--primary-start: #8EC5B9` (mint green) as the main theme. Spacing based on 8rpx grid, shadows and radii are tokenized. Import this in pages that need design tokens.

### Utilities (`utils/`)

- `cloud.js` - Cloud function wrapper (`callFunction`, `uploadFile`, `getTempFileURL`, `database`)
- `initData.js` - Database seeding script
- `qrcode.js` - QR code generation

## Code Conventions

- **Language**: ES6+ JavaScript (no TypeScript in current config)
- **Naming**: camelCase for variables/functions, kebab-case for CSS classes and component files
- **Pages**: Each page = `.js` + `.json` + `.wxml` + `.wxss` (standard mini program page structure)
- **State**: Page-level `data` + `setData()`, global state via `getApp().globalData`
- **Async**: Always use `async/await` for cloud function calls
- **WXSS**: Use rpx units, leverage CSS custom properties from `styles/theme.wxss`

## Git Commit Format

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

## Important Notes

- This is a **native-only** project. Never use UniApp/Taro syntax (`uni.`, `Taro.`, `<div>`, etc.)
- Cloud functions must always verify OPENID before user data operations
- Use atomic operations (`_.inc`, `_.push`) for concurrent database updates
- Content security checks (`security.msgSecCheck`) required for user-generated content
- All backend logic lives in cloud functions - no direct database writes from frontend for sensitive data
