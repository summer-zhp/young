# Image Editor Design Spec

## Overview

Add an image editing tool to the WeChat Mini Program's toolkit page. Users can upload an image, adjust brightness/contrast/saturation, apply social-style filters, crop with aspect ratios, undo the last operation, and save the result to their album.

## Page

**Path**: `packageB/pages/image-editor/image-editor`

**Entry**: New bento-card in `pages/toolkit/toolkit.wxml` under the "效率工具" section with `edit` icon, `bg-mint` color, and NEW badge.

## User Flow

1. Enter page → display upload area (choose from album or camera)
2. After selecting image → enter edit mode, image rendered on Canvas
3. Bottom tabs switch modes: 调整 | 滤镜 | 裁剪
4. Edit → tap "保存" (top right) → export to album
5. "还原" button reverts to previous parameter state

## Page Layout

```
┌──────────────────────────────┐
│ Navigation: 图片编辑  [还原][保存] │
├──────────────────────────────┤
│                              │
│        Canvas Area           │
│    (image scaled to fit)     │
│                              │
├──────────────────────────────┤
│  [调整]   [滤镜]   [裁剪]     │  ← Tab bar
├──────────────────────────────┤
│  Active tab controls:        │
│  - Sliders / filter list /  │
│    crop controls             │
└──────────────────────────────┘
```

## Edit Modules

### Adjust (调整)

Three horizontal sliders with real-time preview:

| Parameter | Range | Default | CSS filter |
|-----------|-------|---------|------------|
| 亮度 (brightness) | 0%–200% | 100% | `brightness()` |
| 对比度 (contrast) | 0%–200% | 100% | `contrast()` |
| 饱和度 (saturate) | 0%–200% | 100% | `saturate()` |

Implementation: `ctx.filter = 'brightness(x) contrast(y) saturate(z)'` combined with any active filter preset.

### Filters (滤镜)

6 social-style presets displayed as a horizontal scrollable list with thumbnail previews:

| Name | Effect | CSS filter value |
|------|--------|-----------------|
| 原图 | No processing | none |
| 日系清新 | Bright + desaturated + warm | `brightness(1.1) saturate(0.8) sepia(0.1)` |
| INS风 | Lowered contrast + faded | `contrast(0.85) saturate(0.9) brightness(1.05)` |
| 港风复古 | Warm + high saturation | `sepia(0.25) saturate(1.3) contrast(1.1)` |
| 电影感 | Desaturated + high contrast + cool | `saturate(0.7) contrast(1.2) hue-rotate(-10deg)` |
| 黑白经典 | Grayscale + high contrast | `grayscale(1) contrast(1.15)` |

Filter selection is additive with adjust parameters. Each filter thumbnail is a small canvas rendering of the image with the filter applied.

### Crop (裁剪)

- Crop overlay rendered on top of the image
- Aspect ratio options at bottom: 自由 | 1:1 | 4:3 | 3:4 | 16:9
- Drag corners/edges of crop box to adjust
- Confirm crops using `drawImage` source clipping parameters
- After crop confirmation, the Canvas redraws with only the cropped region

## Undo Mechanism

- Maintain a `prevParams` object storing the previous state: `{ brightness, contrast, saturate, filterIndex, cropRect }`
- Before any parameter change, snapshot current values into `prevParams`
- "还原" button restores `prevParams` and redraws Canvas
- Single-step undo only — simple and memory-efficient

## Save

1. `wx.canvasToTempFilePath` exports Canvas to temp file (PNG, quality 1.0)
2. `wx.saveImageToPhotosAlbum` saves to device album
3. Handle permission denial with a modal prompting the user to enable access manually

## Technical Approach

**Pure Canvas 2D** — consistent with existing image tools (image-compressor, grid-cutter).

- Canvas `<canvas type="2d">` for all rendering
- CSS filter strings applied via `ctx.filter` for adjustments and filters
- `drawImage` with source rectangle for cropping
- No external dependencies, no cloud functions needed
- All processing is client-side and offline

## File Structure

```
packageB/pages/image-editor/
├── image-editor.js
├── image-editor.json
├── image-editor.wxml
├── image-editor.wxss
```

## Toolkit Integration

Add to `pages/toolkit/toolkit.wxml` in the "效率工具" section (first bento-row), and add `goToImageEditor` navigation handler in `toolkit.js`.
