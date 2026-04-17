# Image Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a client-side image editor with brightness/contrast/saturation adjustment, social-style filter presets, aspect-ratio crop, undo, and save-to-album — all using Canvas 2D.

**Architecture:** Single page under `packageB/pages/image-editor/`. One Canvas 2D for live preview, CSS filter strings via `ctx.filter` for adjustments and filters, `drawImage` source clipping for crop. State managed in page `data` with a single `renderCanvas()` redraw function.

**Tech Stack:** WeChat Mini Program Canvas 2D, CSS filter, TDesign icons, theme.wxss design tokens.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packageB/pages/image-editor/image-editor.js` | Create | All page logic: upload, render, adjust, filter, crop, undo, save |
| `packageB/pages/image-editor/image-editor.wxml` | Create | Page template: canvas, upload area, tab bar, adjust/filter/crop panels |
| `packageB/pages/image-editor/image-editor.wxss` | Create | Page styles following project theme |
| `packageB/pages/image-editor/image-editor.json` | Create | Page config with t-icon component |
| `app.json` | Modify | Add `pages/image-editor/image-editor` to packageB subpackage |
| `pages/toolkit/toolkit.js` | Modify | Add `goToImageEditor` navigation handler |
| `pages/toolkit/toolkit.wxml` | Modify | Add bento-card entry with NEW badge |

---

### Task 1: Page Skeleton + Registration

**Files:**
- Create: `packageB/pages/image-editor/image-editor.js`
- Create: `packageB/pages/image-editor/image-editor.wxml`
- Create: `packageB/pages/image-editor/image-editor.wxss`
- Create: `packageB/pages/image-editor/image-editor.json`
- Modify: `app.json`

- [ ] **Step 1: Create `image-editor.json`**

```json
{
  "navigationBarTitleText": "图片编辑",
  "usingComponents": {
    "t-icon": "tdesign-miniprogram/icon/icon"
  }
}
```

- [ ] **Step 2: Create `image-editor.js` with initial data structure**

```javascript
// packageB/pages/image-editor/image-editor.js
var FILTERS = [
  { name: '原图', css: '' },
  { name: '日系清新', css: 'brightness(1.1) saturate(0.8) sepia(0.1)' },
  { name: 'INS风', css: 'contrast(0.85) saturate(0.9) brightness(1.05)' },
  { name: '港风复古', css: 'sepia(0.25) saturate(1.3) contrast(1.1)' },
  { name: '电影感', css: 'saturate(0.7) contrast(1.2) hue-rotate(-10deg)' },
  { name: '黑白经典', css: 'grayscale(1) contrast(1.15)' }
]

Page({
  data: {
    // Image
    imageSrc: '',
    imageWidth: 0,
    imageHeight: 0,
    hasImage: false,

    // Edit mode
    editMode: 'adjust', // 'adjust' | 'filter' | 'crop'

    // Adjust params (percentage, 100 = no change)
    brightness: 100,
    contrast: 100,
    saturate: 100,

    // Filter
    filterIndex: 0,
    filters: FILTERS,

    // Crop
    cropRatio: 'free',
    cropBox: null,       // { left, top, width, height } in rpx relative to canvas container
    isCropping: false,   // whether currently showing crop overlay

    // Undo
    prevParams: null,
    canUndo: false,

    // Canvas
    canvasWidth: 0,
    canvasHeight: 0,
    imgDisplayX: 0,
    imgDisplayY: 0,
    imgDisplayW: 0,
    imgDisplayH: 0,
    displayScale: 1
  },

  _canvas: null,
  _ctx: null,
  _img: null
})
```

- [ ] **Step 3: Create `image-editor.wxml` shell**

```xml
<!--packageB/pages/image-editor/image-editor.wxml-->
<view class="page">

  <!-- Upload area (shown when no image) -->
  <view class="upload-area" wx:if="{{!hasImage}}" bindtap="chooseImage">
    <view class="upload-box">
      <t-icon name="image" size="72rpx" color="#8EC5B9"></t-icon>
      <text class="upload-text">选择图片</text>
      <text class="upload-hint">支持 JPG、PNG 格式</text>
    </view>
  </view>

  <!-- Editor area (shown when image loaded) -->
  <view class="editor" wx:if="{{hasImage}}">
    <!-- Canvas preview -->
    <view class="canvas-container">
      <canvas type="2d" id="editorCanvas" class="editor-canvas"
        style="width: {{canvasWidth}}px; height: {{canvasHeight}}px">
      </canvas>

      <!-- Crop overlay (only in crop mode) -->
      <view class="crop-overlay" wx:if="{{editMode === 'crop' && cropBox}}">
        <!-- Four semi-transparent masks -->
        <view class="crop-mask" style="top:0; left:0; right:0; height:{{cropBox.top}}px"></view>
        <view class="crop-mask" style="top:{{cropBox.top}}px; left:0; width:{{cropBox.left}}px; height:{{cropBox.height}}px"></view>
        <view class="crop-mask" style="top:{{cropBox.top}}px; right:0; width:{{canvasWidth - cropBox.left - cropBox.width}}px; height:{{cropBox.height}}px"></view>
        <view class="crop-mask" style="top:{{cropBox.top + cropBox.height}}px; left:0; right:0; bottom:0"></view>
        <!-- Crop border -->
        <view class="crop-border" style="left:{{cropBox.left}}px; top:{{cropBox.top}}px; width:{{cropBox.width}}px; height:{{cropBox.height}}px">
          <view class="crop-corner crop-corner-tl" data-corner="tl" catchtouchstart="onCropTouchStart" catchtouchmove="onCropTouchMove"></view>
          <view class="crop-corner crop-corner-tr" data-corner="tr" catchtouchstart="onCropTouchStart" catchtouchmove="onCropTouchMove"></view>
          <view class="crop-corner crop-corner-bl" data-corner="bl" catchtouchstart="onCropTouchStart" catchtouchmove="onCropTouchMove"></view>
          <view class="crop-corner crop-corner-br" data-corner="br" catchtouchstart="onCropTouchStart" catchtouchmove="onCropTouchMove"></view>
        </view>
      </view>
    </view>

    <!-- Top action bar -->
    <view class="action-bar">
      <view class="action-btn undo-btn {{canUndo ? '' : 'disabled'}}" bindtap="undoAction">
        <t-icon name="undo" size="36rpx" color="{{canUndo ? '#8EC5B9' : '#ccc'}}"></t-icon>
        <text>还原</text>
      </view>
      <view class="action-btn save-btn" bindtap="saveImage">
        <t-icon name="download" size="36rpx" color="#8EC5B9"></t-icon>
        <text>保存</text>
      </view>
    </view>

    <!-- Bottom panel -->
    <view class="panel">
      <!-- Tab bar -->
      <view class="tab-bar">
        <view class="tab-item {{editMode === 'adjust' ? 'active' : ''}}" bindtap="switchTab" data-mode="adjust">
          <text>调整</text>
        </view>
        <view class="tab-item {{editMode === 'filter' ? 'active' : ''}}" bindtap="switchTab" data-mode="filter">
          <text>滤镜</text>
        </view>
        <view class="tab-item {{editMode === 'crop' ? 'active' : ''}}" bindtap="switchTab" data-mode="crop">
          <text>裁剪</text>
        </view>
      </view>

      <!-- Adjust panel -->
      <view class="panel-content" wx:if="{{editMode === 'adjust'}}">
        <view class="slider-group">
          <view class="slider-row">
            <text class="slider-label">亮度</text>
            <slider class="editor-slider" min="0" max="200" value="{{brightness}}"
              activeColor="#8EC5B9" backgroundColor="#e5e5e5" block-size="20"
              bindchange="onBrightnessChange" />
            <text class="slider-value">{{brightness}}%</text>
          </view>
          <view class="slider-row">
            <text class="slider-label">对比度</text>
            <slider class="editor-slider" min="0" max="200" value="{{contrast}}"
              activeColor="#8EC5B9" backgroundColor="#e5e5e5" block-size="20"
              bindchange="onContrastChange" />
            <text class="slider-value">{{contrast}}%</text>
          </view>
          <view class="slider-row">
            <text class="slider-label">饱和度</text>
            <slider class="editor-slider" min="0" max="200" value="{{saturate}}"
              activeColor="#8EC5B9" backgroundColor="#e5e5e5" block-size="20"
              bindchange="onSaturateChange" />
            <text class="slider-value">{{saturate}}%</text>
          </view>
        </view>
      </view>

      <!-- Filter panel -->
      <view class="panel-content" wx:if="{{editMode === 'filter'}}">
        <scroll-view scroll-x class="filter-scroll">
          <view class="filter-list">
            <view class="filter-item {{filterIndex === index ? 'active' : ''}}"
              wx:for="{{filters}}" wx:key="index"
              bindtap="onFilterSelect" data-index="{{index}}">
              <view class="filter-preview filter-color-{{index}}">
                <t-icon name="{{index === 0 ? 'image' : 'filter'}}" size="32rpx" color="#fff"></t-icon>
              </view>
              <text class="filter-name">{{item.name}}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- Crop panel -->
      <view class="panel-content" wx:if="{{editMode === 'crop'}}">
        <view class="crop-ratios">
          <view class="ratio-item {{cropRatio === 'free' ? 'active' : ''}}" bindtap="onRatioSelect" data-ratio="free">
            <text>自由</text>
          </view>
          <view class="ratio-item {{cropRatio === '1:1' ? 'active' : ''}}" bindtap="onRatioSelect" data-ratio="1:1">
            <text>1:1</text>
          </view>
          <view class="ratio-item {{cropRatio === '4:3' ? 'active' : ''}}" bindtap="onRatioSelect" data-ratio="4:3">
            <text>4:3</text>
          </view>
          <view class="ratio-item {{cropRatio === '3:4' ? 'active' : ''}}" bindtap="onRatioSelect" data-ratio="3:4">
            <text>3:4</text>
          </view>
          <view class="ratio-item {{cropRatio === '16:9' ? 'active' : ''}}" bindtap="onRatioSelect" data-ratio="16:9">
            <text>16:9</text>
          </view>
        </view>
        <view class="crop-confirm-bar">
          <view class="crop-cancel" bindtap="cancelCrop">
            <text>取消</text>
          </view>
          <view class="crop-confirm" bindtap="confirmCrop">
            <text>确认裁剪</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</view>
```

- [ ] **Step 4: Create `image-editor.wxss`**

```css
/* packageB/pages/image-editor/image-editor.wxss */
@import '../../../styles/theme.wxss';

.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7f8 0%, #e8f5f3 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ===== Upload Area ===== */
.upload-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
}

.upload-box {
  width: 100%;
  height: 500rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20rpx;
  background: var(--surface-white);
  border-radius: var(--radius-2xl);
  border: 2rpx dashed rgba(142, 197, 185, 0.4);
  box-shadow: var(--shadow-sm);
}

.upload-text {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.upload-hint {
  font-size: 24rpx;
  color: var(--text-tertiary);
}

/* ===== Editor Layout ===== */
.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Canvas Container */
.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: #1a1a1a;
  min-height: 400rpx;
}

.editor-canvas {
  display: block;
}

/* ===== Crop Overlay ===== */
.crop-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.crop-mask {
  position: absolute;
  background: rgba(0, 0, 0, 0.5);
}

.crop-border {
  position: absolute;
  border: 2rpx solid #ffffff;
  pointer-events: auto;
}

.crop-corner {
  position: absolute;
  width: 40rpx;
  height: 40rpx;
  pointer-events: auto;
}

.crop-corner-tl { top: -20rpx; left: -20rpx; }
.crop-corner-tr { top: -20rpx; right: -20rpx; }
.crop-corner-bl { bottom: -20rpx; left: -20rpx; }
.crop-corner-br { bottom: -20rpx; right: -20rpx; }

/* ===== Action Bar ===== */
.action-bar {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 32rpx;
  background: var(--surface-white);
  border-bottom: 1rpx solid var(--border-light);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
}

.action-btn text {
  font-size: 28rpx;
  color: var(--text-secondary);
}

.action-btn.disabled text {
  color: var(--text-disabled);
}

/* ===== Bottom Panel ===== */
.panel {
  background: var(--surface-white);
  border-top: 1rpx solid var(--border-light);
  padding-bottom: env(safe-area-inset-bottom);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  border-bottom: 1rpx solid var(--border-light);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: var(--text-tertiary);
  font-weight: 500;
  position: relative;
}

.tab-item.active {
  color: var(--primary-start);
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 4rpx;
  background: var(--primary-start);
  border-radius: 2rpx;
}

/* Panel Content */
.panel-content {
  padding: 24rpx 32rpx;
  min-height: 240rpx;
}

/* ===== Adjust Sliders ===== */
.slider-group {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.slider-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  width: 80rpx;
  flex-shrink: 0;
}

.editor-slider {
  flex: 1;
  margin: 0;
}

.slider-value {
  font-size: 24rpx;
  color: var(--text-primary);
  font-weight: 600;
  width: 80rpx;
  text-align: right;
  flex-shrink: 0;
}

/* ===== Filter Panel ===== */
.filter-scroll {
  white-space: nowrap;
}

.filter-list {
  display: flex;
  gap: 24rpx;
  padding: 8rpx 0;
}

.filter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}

.filter-preview {
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 3rpx solid transparent;
  transition: border-color 0.2s;
}

.filter-item.active .filter-preview {
  border-color: var(--primary-start);
}

.filter-color-0 { background: linear-gradient(135deg, #e0e0e0, #bdbdbd); }
.filter-color-1 { background: linear-gradient(135deg, #FFEECC, #FFE0A0); }
.filter-color-2 { background: linear-gradient(135deg, #E8DDD5, #D5C8BD); }
.filter-color-3 { background: linear-gradient(135deg, #FFD4A0, #F0B878); }
.filter-color-4 { background: linear-gradient(135deg, #B0B8C8, #8A94A8); }
.filter-color-5 { background: linear-gradient(135deg, #999999, #666666); }

.filter-name {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.filter-item.active .filter-name {
  color: var(--primary-start);
  font-weight: 600;
}

/* ===== Crop Panel ===== */
.crop-ratios {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.ratio-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: var(--radius-md);
  border: 2rpx solid var(--border-light);
  font-size: 26rpx;
  color: var(--text-secondary);
}

.ratio-item.active {
  background: rgba(142, 197, 185, 0.1);
  border-color: var(--primary-start);
  color: var(--primary-start);
  font-weight: 600;
}

.crop-confirm-bar {
  display: flex;
  gap: 24rpx;
}

.crop-cancel, .crop-confirm {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  border-radius: var(--radius-xl);
  font-size: 28rpx;
  font-weight: 600;
}

.crop-cancel {
  background: var(--surface-hover);
  color: var(--text-secondary);
}

.crop-confirm {
  background: linear-gradient(135deg, #8EC5B9 0%, #6f9a8e 100%);
  color: #ffffff;
}

.crop-confirm:active {
  opacity: 0.85;
}
```

- [ ] **Step 5: Register page in `app.json`**

Add `"pages/image-editor/image-editor"` to the `packageB` subpackage pages array (after the `grid-cutter` entry).

- [ ] **Step 6: Commit**

```bash
git add packageB/pages/image-editor/ app.json
git commit -m "feat(image-editor): scaffold page skeleton with layout and styles"
```

---

### Task 2: Image Upload + Canvas Rendering

**Files:**
- Modify: `packageB/pages/image-editor/image-editor.js`

- [ ] **Step 1: Add `chooseImage` and canvas init methods to the Page object**

Add these methods inside the `Page({})` object in `image-editor.js`:

```javascript
  // Choose image from album or camera
  chooseImage: function () {
    var self = this
    wx.chooseImage({
      count: 1,
      sizeType: ['original'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePath = res.tempFilePaths[0]
        wx.getImageInfo({
          src: tempFilePath,
          success: function (info) {
            self.setData({
              imageSrc: tempFilePath,
              imageWidth: info.width,
              imageHeight: info.height,
              hasImage: true
            })
            // Wait for WXML to render canvas, then init
            setTimeout(function () {
              self.initCanvas()
            }, 300)
          }
        })
      }
    })
  },

  // Initialize canvas and load image
  initCanvas: function () {
    var self = this
    var query = wx.createSelectorQuery()
    query.select('#editorCanvas').fields({ node: true, size: true })
    query.exec(function (res) {
      if (!res || !res[0]) {
        wx.showToast({ title: 'Canvas 初始化失败', icon: 'none' })
        return
      }

      var canvas = res[0].node
      var ctx = canvas.getContext('2d')
      var dpr = wx.getWindowInfo().pixelRatio

      // Calculate canvas display size to fit image within available space
      var containerWidth = res[0].width
      var containerHeight = res[0].height
      var imgW = self.data.imageWidth
      var imgH = self.data.imageHeight

      // Scale image to fit container
      var scale = Math.min(containerWidth / imgW, containerHeight / imgH)
      var displayW = Math.floor(imgW * scale)
      var displayH = Math.floor(imgH * scale)
      var offsetX = Math.floor((containerWidth - displayW) / 2)
      var offsetY = Math.floor((containerHeight - displayH) / 2)

      canvas.width = containerWidth * dpr
      canvas.height = containerHeight * dpr
      ctx.scale(dpr, dpr)

      self._canvas = canvas
      self._ctx = ctx

      // Load image
      var img = canvas.createImage()
      img.src = self.data.imageSrc
      img.onload = function () {
        self._img = img
        self.setData({
          canvasWidth: containerWidth,
          canvasHeight: containerHeight,
          imgDisplayX: offsetX,
          imgDisplayY: offsetY,
          imgDisplayW: displayW,
          imgDisplayH: displayH,
          displayScale: scale
        })
        self.renderCanvas()
      }
      img.onerror = function () {
        wx.showToast({ title: '图片加载失败', icon: 'none' })
      }
    })
  },

  // Build the combined CSS filter string
  getFilterString: function () {
    var parts = []
    var b = this.data.brightness / 100
    var c = this.data.contrast / 100
    var s = this.data.saturate / 100
    parts.push('brightness(' + b + ')')
    parts.push('contrast(' + c + ')')
    parts.push('saturate(' + s + ')')

    var preset = FILTERS[this.data.filterIndex].css
    if (preset) {
      parts.push(preset)
    }
    return parts.join(' ')
  },

  // Render image on canvas with current filters
  renderCanvas: function () {
    if (!this._ctx || !this._img) return

    var ctx = this._ctx
    var canvas = this._canvas
    var dpr = wx.getWindowInfo().pixelRatio
    var cw = this.data.canvasWidth
    var ch = this.data.canvasHeight

    // Clear
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Black background
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, cw, ch)

    // Apply filter
    ctx.filter = this.getFilterString()

    // Draw image centered
    ctx.drawImage(
      this._img,
      0, 0, this.data.imageWidth, this.data.imageHeight,
      this.data.imgDisplayX, this.data.imgDisplayY,
      this.data.imgDisplayW, this.data.imgDisplayH
    )

    // Reset filter
    ctx.filter = 'none'
  },
```

- [ ] **Step 2: Verify in DevTools**

Run in WeChat Developer Tools: navigate to the page, tap upload area, select an image. Image should render on the canvas with default settings (no filter, 100% brightness/contrast/saturation).

- [ ] **Step 3: Commit**

```bash
git add packageB/pages/image-editor/image-editor.js
git commit -m "feat(image-editor): add image upload and canvas rendering"
```

---

### Task 3: Tab Switching + Adjust Module

**Files:**
- Modify: `packageB/pages/image-editor/image-editor.js`

- [ ] **Step 1: Add tab switching and slider handlers**

Add these methods to the Page object:

```javascript
  // Switch edit tab
  switchTab: function (e) {
    var mode = e.currentTarget.dataset.mode
    if (mode === 'crop' && !this.data.cropBox) {
      this.initCropBox()
    }
    this.setData({ editMode: mode })
  },

  // Save current params for undo before any change
  savePrevParams: function () {
    this.setData({
      prevParams: {
        brightness: this.data.brightness,
        contrast: this.data.contrast,
        saturate: this.data.saturate,
        filterIndex: this.data.filterIndex
      },
      canUndo: true
    })
  },

  // Brightness slider
  onBrightnessChange: function (e) {
    this.savePrevParams()
    this.setData({ brightness: e.detail.value })
    this.renderCanvas()
  },

  // Contrast slider
  onContrastChange: function (e) {
    this.savePrevParams()
    this.setData({ contrast: e.detail.value })
    this.renderCanvas()
  },

  // Saturate slider
  onSaturateChange: function (e) {
    this.savePrevParams()
    this.setData({ saturate: e.detail.value })
    this.renderCanvas()
  },
```

- [ ] **Step 2: Verify in DevTools**

Upload an image, drag each slider. The canvas should update in real-time showing brightness, contrast, and saturation changes.

- [ ] **Step 3: Commit**

```bash
git add packageB/pages/image-editor/image-editor.js
git commit -m "feat(image-editor): add tab switching and adjust sliders"
```

---

### Task 4: Filter Presets Module

**Files:**
- Modify: `packageB/pages/image-editor/image-editor.js`

- [ ] **Step 1: Add filter selection handler**

```javascript
  // Select filter preset
  onFilterSelect: function (e) {
    var index = parseInt(e.currentTarget.dataset.index)
    this.savePrevParams()
    this.setData({ filterIndex: index })
    this.renderCanvas()
  },
```

- [ ] **Step 2: Verify in DevTools**

Upload an image, switch to Filter tab, tap each filter. Canvas should update showing the selected filter effect combined with current adjust settings.

- [ ] **Step 3: Commit**

```bash
git add packageB/pages/image-editor/image-editor.js
git commit -m "feat(image-editor): add filter preset selection"
```

---

### Task 5: Crop Module — Init + Ratio Selection

**Files:**
- Modify: `packageB/pages/image-editor/image-editor.js`

- [ ] **Step 1: Add crop initialization and ratio handlers**

```javascript
  // Initialize crop box centered on the image
  initCropBox: function () {
    var imgW = this.data.imgDisplayW
    var imgH = this.data.imgDisplayH
    var imgX = this.data.imgDisplayX
    var imgY = this.data.imgDisplayY

    // Default: cover 80% of the image
    var cropW = Math.floor(imgW * 0.8)
    var cropH = Math.floor(imgH * 0.8)
    var cropX = imgX + Math.floor((imgW - cropW) / 2)
    var cropY = imgY + Math.floor((imgH - cropH) / 2)

    this.setData({
      cropBox: {
        left: cropX,
        top: cropY,
        width: cropW,
        height: cropH
      },
      cropRatio: 'free'
    })
  },

  // Select crop ratio
  onRatioSelect: function (e) {
    var ratio = e.currentTarget.dataset.ratio
    var imgW = this.data.imgDisplayW
    var imgH = this.data.imgDisplayH
    var imgX = this.data.imgDisplayX
    var imgY = this.data.imgDisplayY

    var cropW, cropH

    if (ratio === 'free') {
      cropW = Math.floor(imgW * 0.8)
      cropH = Math.floor(imgH * 0.8)
    } else {
      var parts = ratio.split(':')
      var ratioW = parseInt(parts[0])
      var ratioH = parseInt(parts[1])
      // Fit ratio within 80% of image
      var maxW = imgW * 0.8
      var maxH = imgH * 0.8
      if (maxW / ratioW > maxH / ratioH) {
        cropH = maxH
        cropW = cropH * ratioW / ratioH
      } else {
        cropW = maxW
        cropH = cropW * ratioH / ratioW
      }
      cropW = Math.floor(cropW)
      cropH = Math.floor(cropH)
    }

    var cropX = imgX + Math.floor((imgW - cropW) / 2)
    var cropY = imgY + Math.floor((imgH - cropH) / 2)

    this.setData({
      cropRatio: ratio,
      cropBox: {
        left: cropX,
        top: cropY,
        width: cropW,
        height: cropH
      }
    })
  },
```

- [ ] **Step 2: Verify in DevTools**

Upload an image, switch to Crop tab. Crop overlay should appear centered on the image. Tap each ratio button — crop box should reshape to match the selected ratio while staying centered.

- [ ] **Step 3: Commit**

```bash
git add packageB/pages/image-editor/image-editor.js
git commit -m "feat(image-editor): add crop box init and ratio selection"
```

---

### Task 6: Crop Module — Touch Drag + Apply

**Files:**
- Modify: `packageB/pages/image-editor/image-editor.js`

- [ ] **Step 1: Add touch drag handling for crop corners**

```javascript
  _cropTouchCorner: '',
  _cropStartX: 0,
  _cropStartY: 0,
  _cropStartBox: null,

  onCropTouchStart: function (e) {
    var corner = e.currentTarget.dataset.corner
    var touch = e.touches[0]
    this._cropTouchCorner = corner
    this._cropStartX = touch.clientX
    this._cropStartY = touch.clientY
    this._cropStartBox = {
      left: this.data.cropBox.left,
      top: this.data.cropBox.top,
      width: this.data.cropBox.width,
      height: this.data.cropBox.height
    }
  },

  onCropTouchMove: function (e) {
    if (!this._cropStartBox) return

    var touch = e.touches[0]
    var dx = touch.clientX - this._cropStartX
    var dy = touch.clientY - this._cropStartY
    var box = this._cropStartBox
    var corner = this._cropTouchCorner

    var imgX = this.data.imgDisplayX
    var imgY = this.data.imgDisplayY
    var imgW = this.data.imgDisplayW
    var imgH = this.data.imgDisplayH
    var minSize = 60 // minimum crop size in px

    var newLeft = box.left
    var newTop = box.top
    var newWidth = box.width
    var newHeight = box.height

    if (corner === 'br') {
      newWidth = Math.max(minSize, Math.min(box.width + dx, imgX + imgW - box.left))
      newHeight = Math.max(minSize, Math.min(box.height + dy, imgY + imgH - box.top))
    } else if (corner === 'bl') {
      newLeft = Math.max(imgX, box.left + dx)
      newWidth = Math.max(minSize, box.left + box.width - newLeft)
      newHeight = Math.max(minSize, Math.min(box.height + dy, imgY + imgH - box.top))
    } else if (corner === 'tr') {
      newWidth = Math.max(minSize, Math.min(box.width + dx, imgX + imgW - box.left))
      newTop = Math.max(imgY, box.top + dy)
      newHeight = Math.max(minSize, box.top + box.height - newTop)
    } else if (corner === 'tl') {
      newLeft = Math.max(imgX, box.left + dx)
      newWidth = Math.max(minSize, box.left + box.width - newLeft)
      newTop = Math.max(imgY, box.top + dy)
      newHeight = Math.max(minSize, box.top + box.height - newTop)
    }

    // Apply ratio constraint
    if (this.data.cropRatio !== 'free') {
      var parts = this.data.cropRatio.split(':')
      var ratioW = parseInt(parts[0])
      var ratioH = parseInt(parts[1])
      var targetRatio = ratioW / ratioH
      // Adjust height to match ratio based on width
      newHeight = newWidth / targetRatio
      if (newTop + newHeight > imgY + imgH) {
        newHeight = imgY + imgH - newTop
        newWidth = newHeight * targetRatio
      }
      newWidth = Math.floor(newWidth)
      newHeight = Math.floor(newHeight)
    }

    this.setData({
      cropBox: {
        left: Math.floor(newLeft),
        top: Math.floor(newTop),
        width: Math.floor(newWidth),
        height: Math.floor(newHeight)
      }
    })
  },
```

- [ ] **Step 2: Add confirm/cancel crop handlers**

```javascript
  // Cancel crop
  cancelCrop: function () {
    this.setData({
      editMode: 'adjust',
      cropBox: null,
      cropRatio: 'free'
    })
  },

  // Confirm crop: apply crop to the image
  confirmCrop: function () {
    var self = this
    var box = this.data.cropBox
    if (!box) return

    // Convert display coords to image coords
    var scale = this.data.displayScale
    var imgX = this.data.imgDisplayX
    var imgY = this.data.imgDisplayY

    var srcX = Math.floor((box.left - imgX) / scale)
    var srcY = Math.floor((box.top - imgY) / scale)
    var srcW = Math.floor(box.width / scale)
    var srcH = Math.floor(box.height / scale)

    // Clamp to image bounds
    srcX = Math.max(0, srcX)
    srcY = Math.max(0, srcY)
    srcW = Math.min(srcW, this.data.imageWidth - srcX)
    srcH = Math.min(srcH, this.data.imageHeight - srcY)

    // Save undo state
    this.savePrevParams()
    var prev = this.data.prevParams
    prev.croppedSrc = this.data.imageSrc
    prev.prevImageWidth = this.data.imageWidth
    prev.prevImageHeight = this.data.imageHeight
    prev.prevImgDisplayX = this.data.imgDisplayX
    prev.prevImgDisplayY = this.data.imgDisplayY
    prev.prevImgDisplayW = this.data.imgDisplayW
    prev.prevImgDisplayH = this.data.imgDisplayH
    prev.prevDisplayScale = this.data.displayScale

    // Use a temp canvas to crop
    var query = wx.createSelectorQuery()
    query.select('#editorCanvas').fields({ node: true })
    query.exec(function (res) {
      if (!res[0]) return

      var canvas = res[0].node
      var ctx = canvas.getContext('2d')
      var dpr = wx.getWindowInfo().pixelRatio

      // Draw cropped region at full resolution
      ctx.save()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.restore()

      // Calculate new display dimensions
      var containerW = self.data.canvasWidth
      var containerH = self.data.canvasHeight
      var newScale = Math.min(containerW / srcW, containerH / srcH)
      var newDispW = Math.floor(srcW * newScale)
      var newDispH = Math.floor(srcH * newScale)
      var newOffX = Math.floor((containerW - newDispW) / 2)
      var newOffY = Math.floor((containerH - newDispH) / 2)

      ctx.filter = self.getFilterString()
      ctx.drawImage(
        self._img,
        srcX, srcY, srcW, srcH,
        newOffX, newOffY, newDispW, newDispH
      )
      ctx.filter = 'none'

      // Export cropped image to temp file
      wx.canvasToTempFilePath({
        canvas: canvas,
        fileType: 'png',
        quality: 1,
        success: function (tempRes) {
          // Reload the cropped image as the new source
          wx.getImageInfo({
            src: tempRes.tempFilePath,
            success: function (info) {
              var newImg = canvas.createImage()
              newImg.src = tempRes.tempFilePath
              newImg.onload = function () {
                self._img = newImg
                self.setData({
                  imageSrc: tempRes.tempFilePath,
                  imageWidth: info.width,
                  imageHeight: info.height,
                  imgDisplayX: newOffX,
                  imgDisplayY: newOffY,
                  imgDisplayW: newDispW,
                  imgDisplayH: newDispH,
                  displayScale: newScale,
                  editMode: 'adjust',
                  cropBox: null,
                  // Reset adjustments since they're baked into the cropped image
                  brightness: 100,
                  contrast: 100,
                  saturate: 100,
                  filterIndex: 0
                })
              }
            }
          })
        },
        fail: function () {
          wx.showToast({ title: '裁剪失败', icon: 'none' })
        }
      })
    })
  },
```

- [ ] **Step 3: Verify in DevTools**

Upload image, switch to Crop tab, drag corners to resize crop box, select different ratios. Tap "确认裁剪" — canvas should redraw with only the cropped region.

- [ ] **Step 4: Commit**

```bash
git add packageB/pages/image-editor/image-editor.js
git commit -m "feat(image-editor): add crop drag handling and confirm crop"
```

---

### Task 7: Undo + Save

**Files:**
- Modify: `packageB/pages/image-editor/image-editor.js`

- [ ] **Step 1: Add undo handler**

```javascript
  // Undo last action
  undoAction: function () {
    var prev = this.data.prevParams
    if (!prev) return

    // If it was a crop undo, restore the previous image
    if (prev.croppedSrc) {
      var self = this
      var canvas = this._canvas
      var oldImg = canvas.createImage()
      oldImg.src = prev.croppedSrc
      oldImg.onload = function () {
        self._img = oldImg
        self.setData({
          imageSrc: prev.croppedSrc,
          imageWidth: prev.prevImageWidth,
          imageHeight: prev.prevImageHeight,
          imgDisplayX: prev.prevImgDisplayX,
          imgDisplayY: prev.prevImgDisplayY,
          imgDisplayW: prev.prevImgDisplayW,
          imgDisplayH: prev.prevImgDisplayH,
          displayScale: prev.prevDisplayScale,
          brightness: prev.brightness,
          contrast: prev.contrast,
          saturate: prev.saturate,
          filterIndex: prev.filterIndex,
          canUndo: false,
          prevParams: null
        })
        self.renderCanvas()
      }
      return
    }

    // Parameter undo
    this.setData({
      brightness: prev.brightness,
      contrast: prev.contrast,
      saturate: prev.saturate,
      filterIndex: prev.filterIndex,
      canUndo: false,
      prevParams: null
    })
    this.renderCanvas()
  },
```

- [ ] **Step 2: Add save handler**

```javascript
  // Save image to album
  saveImage: function () {
    var self = this

    wx.showLoading({ title: '保存中...' })

    // Re-render at full image resolution for export
    var canvas = this._canvas
    var ctx = this._ctx
    var dpr = wx.getWindowInfo().pixelRatio
    var imgW = this.data.imageWidth
    var imgH = this.data.imageHeight

    // Set canvas to full image resolution
    canvas.width = imgW
    canvas.height = imgH
    ctx.setTransform(1, 0, 0, 1, 0, 0)

    // Apply filter and draw
    ctx.filter = this.getFilterString()
    ctx.drawImage(this._img, 0, 0, imgW, imgH)
    ctx.filter = 'none'

    // Export
    wx.canvasToTempFilePath({
      canvas: canvas,
      fileType: 'png',
      quality: 1,
      success: function (tempRes) {
        // Restore canvas display size
        var containerW = self.data.canvasWidth
        var containerH = self.data.canvasHeight
        canvas.width = containerW * dpr
        canvas.height = containerH * dpr
        ctx.scale(dpr, dpr)
        self.renderCanvas()

        // Save to album
        wx.saveImageToPhotosAlbum({
          filePath: tempRes.tempFilePath,
          success: function () {
            wx.hideLoading()
            wx.showToast({ title: '保存成功', icon: 'success' })
          },
          fail: function (err) {
            wx.hideLoading()
            if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
              wx.showModal({
                title: '提示',
                content: '需要相册权限才能保存图片，请在设置中开启',
                confirmText: '去设置',
                confirmColor: '#8EC5B9',
                success: function (res) {
                  if (res.confirm) {
                    wx.openSetting()
                  }
                }
              })
            } else {
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          }
        })
      },
      fail: function () {
        wx.hideLoading()
        // Restore canvas
        var containerW = self.data.canvasWidth
        var containerH = self.data.canvasHeight
        canvas.width = containerW * dpr
        canvas.height = containerH * dpr
        ctx.scale(dpr, dpr)
        self.renderCanvas()
        wx.showToast({ title: '导出失败', icon: 'none' })
      }
    })
  }
```

- [ ] **Step 3: Verify in DevTools**

Upload image, adjust sliders, tap "还原" — settings should revert. Tap "保存" — image should save to album (or show permission dialog).

- [ ] **Step 4: Commit**

```bash
git add packageB/pages/image-editor/image-editor.js
git commit -m "feat(image-editor): add undo and save-to-album"
```

---

### Task 8: Toolkit Entry Integration

**Files:**
- Modify: `pages/toolkit/toolkit.js`
- Modify: `pages/toolkit/toolkit.wxml`

- [ ] **Step 1: Add navigation handler to `toolkit.js`**

Add this method to the Page object:

```javascript
  goToImageEditor: function () {
    wx.navigateTo({
      url: '/packageB/pages/image-editor/image-editor'
    })
  },
```

- [ ] **Step 2: Add bento card to `toolkit.wxml`**

Add a new `bento-row` after the existing second bento-row in the "效率工具" section (after the 九宫格切图 row):

```xml
      <view class="bento-row" style="margin-top: 16rpx">
        <view class="bento-card" bindtap="goToImageEditor" style="animation-delay: 0.25s">
          <view class="card-badge">NEW</view>
          <view class="bento-icon bg-mint">
            <t-icon name="edit" size="40rpx" color="#fff"></t-icon>
          </view>
          <text class="bento-name">图片编辑</text>
          <text class="bento-desc">滤镜裁剪调色</text>
        </view>
      </view>
```

- [ ] **Step 3: Verify in DevTools**

Navigate to toolkit page, tap the new "图片编辑" card, should navigate to the image editor page.

- [ ] **Step 4: Commit**

```bash
git add pages/toolkit/toolkit.js pages/toolkit/toolkit.wxml
git commit -m "feat(toolkit): add image editor entry with NEW badge"
```
