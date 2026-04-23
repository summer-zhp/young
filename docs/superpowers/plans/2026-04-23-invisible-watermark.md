# 隐形水印/版权保护 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个图片水印工具，支持可见平铺文字水印和不可见 LSB 隐写术水印两种模式，纯本地 Canvas 实现。

**Architecture:** 新增 `utils/watermark.js` 封装水印核心算法（LSB 编解码 + 可见水印绘制），新增 `packageB/pages/watermark/watermark` 页面负责 UI 和交互。在 toolkit 页面「签名安全」分区新增入口卡片。

**Tech Stack:** 微信小程序 Canvas 2D API、`wx.chooseMedia`、`wx.saveImageToPhotosAlbum`、TDesign 图标组件

---

### Task 1: 创建水印核心算法模块 `utils/watermark.js`

**Files:**
- Create: `utils/watermark.js`

- [ ] **Step 1: 创建 `utils/watermark.js` 文件，包含 LSB 编码和可见水印绘制函数**

```javascript
// utils/watermark.js

/**
 * LSB 隐写术 - 将文字信息编码到图片像素的最低有效位
 * @param {ImageData} imageData - Canvas ImageData 对象
 * @param {string} text - 要嵌入的文字
 * @returns {boolean} 是否成功嵌入
 */
function encodeLSB(imageData, text) {
  // 将文字转为 UTF-8 字节数组
  var encoder = new TextEncoder()
  var textBytes = encoder.encode(text)
  var byteLen = textBytes.length

  // 构建二进制信息: [32位长度头(小端序)] [UTF-8字节] [16位结束标记 0xABCD]
  var bits = []

  // 32位长度头（小端序）
  for (var i = 0; i < 32; i++) {
    bits.push((byteLen >> i) & 1)
  }

  // UTF-8 编码的文字字节
  for (var j = 0; j < byteLen; j++) {
    for (var k = 7; k >= 0; k--) {
      bits.push((textBytes[j] >> k) & 1)
    }
  }

  // 16位结束标记 0xABCD = 1010 1011 1100 1101
  var endMarker = [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1]
  for (var m = 0; m < endMarker.length; m++) {
    bits.push(endMarker[m])
  }

  // 检查容量是否足够（每个像素 3 bit：R/G/B 各 1 bit）
  var totalBits = bits.length
  var maxBits = (imageData.data.length / 4) * 3
  if (totalBits > maxBits) {
    return false
  }

  // 将信息写入像素最低位
  var pixels = imageData.data
  var bitIndex = 0
  var pixelIndex = 0

  while (bitIndex < totalBits) {
    var pixelBase = pixelIndex * 4
    // R 通道
    if (bitIndex < totalBits) {
      pixels[pixelBase] = (pixels[pixelBase] & 0xFE) | bits[bitIndex]
      bitIndex++
    }
    // G 通道
    if (bitIndex < totalBits) {
      pixels[pixelBase + 1] = (pixels[pixelBase + 1] & 0xFE) | bits[bitIndex]
      bitIndex++
    }
    // B 通道
    if (bitIndex < totalBits) {
      pixels[pixelBase + 2] = (pixels[pixelBase + 2] & 0xFE) | bits[bitIndex]
      bitIndex++
    }
    pixelIndex++
  }

  return true
}

/**
 * 在 Canvas 上绘制可见平铺水印
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D 上下文
 * @param {number} width - 画布宽度
 * @param {number} height - 画布高度
 * @param {string} text - 水印文字
 * @param {number} fontSize - 字体大小（px）
 * @param {number} opacity - 透明度 0-1
 */
function drawVisibleWatermark(ctx, width, height, text, fontSize, opacity) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.font = fontSize + 'px sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 以 -45 度旋转平铺
  var angle = -Math.PI / 4
  var diagonal = Math.sqrt(width * width + height * height)
  var spacingX = fontSize * text.length * 1.5 + fontSize * 4
  var spacingY = fontSize * 3

  ctx.translate(width / 2, height / 2)
  ctx.rotate(angle)

  for (var y = -diagonal; y < diagonal; y += spacingY) {
    for (var x = -diagonal; x < diagonal; x += spacingX) {
      ctx.fillText(text, x, y)
    }
  }

  ctx.restore()
}

module.exports = {
  encodeLSB: encodeLSB,
  drawVisibleWatermark: drawVisibleWatermark
}
```

- [ ] **Step 2: Commit**

```bash
git add utils/watermark.js
git commit -m "feat(watermark): 添加水印核心算法模块 - LSB 编码与可见水印绘制"
```

---

### Task 2: 创建水印页面 - WXML 模板

**Files:**
- Create: `packageB/pages/watermark/watermark.wxml`
- Create: `packageB/pages/watermark/watermark.json`

- [ ] **Step 1: 创建 `packageB/pages/watermark/watermark.json`**

```json
{
  "navigationBarTitleText": "隐形水印",
  "usingComponents": {
    "t-icon": "tdesign-miniprogram/icon/icon"
  }
}
```

- [ ] **Step 2: 创建 `packageB/pages/watermark/watermark.wxml`**

```xml
<!--packageB/pages/watermark/watermark.wxml-->
<view class="page">

  <!-- 上传区域（无图片时显示） -->
  <view class="upload-area" wx:if="{{!hasImage}}" bindtap="chooseImage">
    <view class="upload-box">
      <t-icon name="image" size="72rpx" color="#8EC5B9"></t-icon>
      <text class="upload-text">选择图片</text>
      <text class="upload-hint">支持 JPG、PNG 格式</text>
    </view>
  </view>

  <!-- 编辑区域（有图片时显示） -->
  <view class="editor" wx:if="{{hasImage}}">

    <!-- 图片预览 -->
    <view class="preview-section">
      <image class="preview-image" src="{{imageSrc}}" mode="aspectFit"></image>
      <view class="preview-badge {{mode === 'visible' ? 'badge-visible' : 'badge-invisible'}}">
        {{mode === 'visible' ? '可见水印' : '不可见水印'}}
      </view>
    </view>

    <!-- 控制面板 -->
    <view class="panel">

      <!-- 模式切换 -->
      <view class="mode-tabs">
        <view class="mode-tab {{mode === 'visible' ? 'active' : ''}}" bindtap="switchMode" data-mode="visible">
          <t-icon name="view-module" size="32rpx" color="{{mode === 'visible' ? '#8EC5B9' : '#999'}}"></t-icon>
          <text>可见水印</text>
        </view>
        <view class="mode-tab {{mode === 'invisible' ? 'active' : ''}}" bindtap="switchMode" data-mode="invisible">
          <t-icon name="lock-on" size="32rpx" color="{{mode === 'invisible' ? '#8EC5B9' : '#999'}}"></t-icon>
          <text>不可见水印</text>
        </view>
      </view>

      <view class="panel-content">
        <!-- 水印文字输入 -->
        <view class="input-group">
          <text class="input-label">水印内容</text>
          <input class="watermark-input" placeholder="输入版权信息，如：© 张三" value="{{watermarkText}}" bindinput="onTextChange" maxlength="200" />
          <text class="input-count">{{watermarkText.length}}/200</text>
        </view>

        <!-- 可见模式参数（仅可见模式显示） -->
        <view class="params-section" wx:if="{{mode === 'visible'}}">
          <view class="slider-row">
            <text class="slider-label">透明度</text>
            <slider class="editor-slider" min="5" max="50" value="{{opacity}}" activeColor="#8EC5B9" backgroundColor="#e5e5e5" block-size="20" bindchange="onOpacityChange" />
            <text class="slider-value">{{opacity}}%</text>
          </view>
          <view class="slider-row">
            <text class="slider-label">字体大小</text>
            <slider class="editor-slider" min="12" max="48" value="{{fontSize}}" activeColor="#8EC5B9" backgroundColor="#e5e5e5" block-size="20" bindchange="onFontSizeChange" />
            <text class="slider-value">{{fontSize}}px</text>
          </view>
        </view>

        <!-- 不可见模式提示 -->
        <view class="invisible-tip" wx:if="{{mode === 'invisible'}}">
          <t-icon name="info-circle" size="28rpx" color="#8EC5B9"></t-icon>
          <text class="tip-text">水印信息将隐藏在图片像素中，肉眼完全不可见。保存为 PNG 格式以保护水印。</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-bar">
        <view class="action-btn change-btn" bindtap="chooseImage">
          <t-icon name="swap" size="32rpx" color="#666"></t-icon>
          <text>换图</text>
        </view>
        <view class="action-btn save-btn {{!watermarkText ? 'disabled' : ''}}" bindtap="saveImage">
          <t-icon name="download" size="32rpx" color="{{watermarkText ? '#fff' : '#ccc'}}"></t-icon>
          <text>保存到相册</text>
        </view>
      </view>
    </view>
  </view>

  <!-- 隐藏 Canvas 用于图片处理 -->
  <canvas type="2d" id="watermarkCanvas" class="hidden-canvas"></canvas>
</view>
```

- [ ] **Step 3: Commit**

```bash
git add packageB/pages/watermark/watermark.wxml packageB/pages/watermark/watermark.json
git commit -m "feat(watermark): 添加水印页面模板和配置"
```

---

### Task 3: 创建水印页面 - WXSS 样式

**Files:**
- Create: `packageB/pages/watermark/watermark.wxss`

- [ ] **Step 1: 创建 `packageB/pages/watermark/watermark.wxss`**

```css
/* packageB/pages/watermark/watermark.wxss */
@import '../../../styles/theme.wxss';

.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7f8 0%, #e8f5f3 100%);
  display: flex;
  flex-direction: column;
}

/* ===== 上传区域 ===== */
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

/* ===== 编辑器布局 ===== */
.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ===== 预览区域 ===== */
.preview-section {
  position: relative;
  margin: 24rpx 32rpx 0;
  background: #1a1a1a;
  border-radius: 24rpx;
  overflow: hidden;
  min-height: 400rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  max-height: 600rpx;
}

.preview-badge {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  font-size: 22rpx;
  font-weight: 600;
  padding: 6rpx 16rpx;
  border-radius: 12rpx;
  color: #fff;
}

.badge-visible {
  background: rgba(142, 197, 185, 0.85);
}

.badge-invisible {
  background: rgba(120, 120, 140, 0.85);
}

/* ===== 控制面板 ===== */
.panel {
  background: var(--surface-white);
  border-radius: 32rpx 32rpx 0 0;
  margin-top: 24rpx;
  flex: 1;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.06);
}

/* ===== 模式切换 ===== */
.mode-tabs {
  display: flex;
  border-bottom: 1rpx solid var(--border-light);
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 28rpx 0;
  font-size: 28rpx;
  color: var(--text-tertiary);
  font-weight: 500;
  position: relative;
}

.mode-tab.active {
  color: var(--primary-start);
  font-weight: 600;
}

.mode-tab.active::after {
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

/* ===== 面板内容 ===== */
.panel-content {
  padding: 24rpx 32rpx;
  flex: 1;
}

/* ===== 输入组 ===== */
.input-group {
  margin-bottom: 24rpx;
}

.input-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 12rpx;
  display: block;
}

.watermark-input {
  width: 100%;
  height: 80rpx;
  background: var(--surface-hover);
  border-radius: var(--radius-lg);
  padding: 0 24rpx;
  font-size: 28rpx;
  color: var(--text-primary);
  box-sizing: border-box;
}

.input-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: var(--text-tertiary);
  margin-top: 8rpx;
}

/* ===== 参数滑块 ===== */
.params-section {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding-top: 8rpx;
  border-top: 1rpx solid var(--border-light);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.slider-label {
  font-size: 26rpx;
  color: var(--text-secondary);
  width: 100rpx;
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

/* ===== 不可见水印提示 ===== */
.invisible-tip {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  background: rgba(142, 197, 185, 0.08);
  border-radius: var(--radius-lg);
  padding: 20rpx 24rpx;
}

.tip-text {
  font-size: 24rpx;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* ===== 操作按钮 ===== */
.action-bar {
  display: flex;
  gap: 16rpx;
  padding: 20rpx 32rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid var(--border-light);
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx 0;
  border-radius: var(--radius-xl);
  font-size: 28rpx;
  font-weight: 600;
}

.action-btn text {
  color: inherit;
}

.change-btn {
  flex: 1;
  background: var(--surface-hover);
  color: var(--text-secondary);
}

.change-btn:active {
  opacity: 0.7;
}

.save-btn {
  flex: 2;
  background: linear-gradient(135deg, #8EC5B9 0%, #6f9a8e 100%);
  color: #ffffff;
}

.save-btn:active {
  opacity: 0.85;
}

.save-btn.disabled {
  background: #d0d0d0;
  color: #ccc;
  pointer-events: none;
}

/* ===== 隐藏 Canvas ===== */
.hidden-canvas {
  position: fixed;
  left: -9999px;
  top: -9999px;
  width: 1px;
  height: 1px;
}
```

- [ ] **Step 2: Commit**

```bash
git add packageB/pages/watermark/watermark.wxss
git commit -m "feat(watermark): 添加水印页面样式"
```

---

### Task 4: 创建水印页面 - JS 逻辑

**Files:**
- Create: `packageB/pages/watermark/watermark.js`

- [ ] **Step 1: 创建 `packageB/pages/watermark/watermark.js`**

```javascript
// packageB/pages/watermark/watermark.js
var watermark = require('../../../utils/watermark.js')

Page({
  data: {
    // 图片
    imageSrc: '',
    imageWidth: 0,
    imageHeight: 0,
    hasImage: false,

    // 水印参数
    mode: 'visible', // 'visible' | 'invisible'
    watermarkText: '',
    opacity: 15,       // 可见水印透明度（%）
    fontSize: 24       // 可见水印字体大小（px）
  },

  _canvas: null,
  _ctx: null,
  _img: null,

  // 选择图片
  chooseImage: function () {
    var self = this
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePath = res.tempFiles[0].tempFilePath
        wx.getImageInfo({
          src: tempFilePath,
          success: function (info) {
            self.setData({
              imageSrc: tempFilePath,
              imageWidth: info.width,
              imageHeight: info.height,
              hasImage: true
            })
          }
        })
      }
    })
  },

  // 切换模式
  switchMode: function (e) {
    this.setData({
      mode: e.currentTarget.dataset.mode
    })
  },

  // 水印文字输入
  onTextChange: function (e) {
    this.setData({
      watermarkText: e.detail.value
    })
  },

  // 透明度调节
  onOpacityChange: function (e) {
    this.setData({ opacity: e.detail.value })
  },

  // 字体大小调节
  onFontSizeChange: function (e) {
    this.setData({ fontSize: e.detail.value })
  },

  // 初始化隐藏 Canvas 并加载图片
  initCanvas: function (callback) {
    var self = this
    var query = wx.createSelectorQuery()
    query.select('#watermarkCanvas').fields({ node: true })
    query.exec(function (res) {
      if (!res || !res[0]) {
        wx.showToast({ title: 'Canvas 初始化失败', icon: 'none' })
        return
      }

      var canvas = res[0].node
      var ctx = canvas.getContext('2d')
      var imgW = self.data.imageWidth
      var imgH = self.data.imageHeight

      // 以原始尺寸创建 Canvas
      canvas.width = imgW
      canvas.height = imgH
      ctx.setTransform(1, 0, 0, 1, 0, 0)

      self._canvas = canvas
      self._ctx = ctx

      var img = canvas.createImage()
      img.src = self.data.imageSrc
      img.onload = function () {
        self._img = img
        callback && callback(canvas, ctx)
      }
      img.onerror = function () {
        wx.showToast({ title: '图片加载失败', icon: 'none' })
      }
    })
  },

  // 保存图片
  saveImage: function () {
    var self = this
    var text = this.data.watermarkText.trim()

    if (!text) {
      wx.showToast({ title: '请输入水印内容', icon: 'none' })
      return
    }

    wx.showLoading({ title: '处理中...' })

    this.initCanvas(function (canvas, ctx) {
      var imgW = self.data.imageWidth
      var imgH = self.data.imageHeight

      // 先绘制原图
      ctx.drawImage(self._img, 0, 0, imgW, imgH)

      if (self.data.mode === 'visible') {
        // 可见水印：在原图上叠加平铺文字
        var opacity = self.data.opacity / 100
        var fontSize = self.data.fontSize
        watermark.drawVisibleWatermark(ctx, imgW, imgH, text, fontSize, opacity)

        // 导出为 JPEG（可见水印支持 JPEG）
        self._exportImage(canvas, 'jpg', false)
      } else {
        // 不可见水印：LSB 隐写术
        var imageData = ctx.getImageData(0, 0, imgW, imgH)
        var success = watermark.encodeLSB(imageData, text)

        if (!success) {
          wx.hideLoading()
          wx.showToast({ title: '图片太小，无法嵌入水印', icon: 'none' })
          return
        }

        ctx.putImageData(imageData, 0, 0)

        // 必须导出为 PNG（JPEG 会破坏 LSB 数据）
        self._exportImage(canvas, 'png', true)
      }
    })
  },

  // 导出图片到相册
  _exportImage: function (canvas, fileType, isInvisible) {
    var self = this
    wx.canvasToTempFilePath({
      canvas: canvas,
      fileType: fileType,
      quality: 1,
      success: function (res) {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: function () {
            wx.hideLoading()
            if (isInvisible) {
              wx.showModal({
                title: '保存成功',
                content: '水印已嵌入图片像素中，肉眼完全不可见。请以 PNG 格式分享，避免压缩破坏水印。',
                showCancel: false,
                confirmText: '知道了',
                confirmColor: '#8EC5B9'
              })
            } else {
              wx.showToast({ title: '保存成功', icon: 'success' })
            }
          },
          fail: function (err) {
            wx.hideLoading()
            if (err.errMsg && err.errMsg.indexOf('auth deny') !== -1) {
              wx.showModal({
                title: '提示',
                content: '需要相册权限才能保存图片，请在设置中开启',
                confirmText: '去设置',
                confirmColor: '#8EC5B9',
                success: function (modalRes) {
                  if (modalRes.confirm) {
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
        wx.showToast({ title: '导出失败', icon: 'none' })
      }
    })
  }
})
```

- [ ] **Step 2: Commit**

```bash
git add packageB/pages/watermark/watermark.js
git commit -m "feat(watermark): 添加水印页面逻辑 - 图片选择、模式切换、水印嵌入与保存"
```

---

### Task 5: 注册页面路由 + 工具箱入口

**Files:**
- Modify: `app.json:27-38` — 在 packageB pages 数组中添加新页面
- Modify: `pages/toolkit/toolkit.wxml:88-110` — 在签名安全分区添加卡片
- Modify: `pages/toolkit/toolkit.js:85-93` — 添加导航方法

- [ ] **Step 1: 在 `app.json` 的 packageB pages 中注册水印页面**

在 `pages/image-editor/image-editor` 之后添加：

```json
"pages/watermark/watermark"
```

- [ ] **Step 2: 在 `pages/toolkit/toolkit.js` 添加导航方法**

在 `goToImageEditor` 方法之后添加：

```javascript
  // 跳转到隐形水印页面
  goToWatermark() {
    wx.navigateTo({
      url: '/packageB/pages/watermark/watermark'
    })
  }
```

- [ ] **Step 3: 在 `pages/toolkit/toolkit.wxml` 的「签名安全」分区添加卡片**

在签名安全的 `bento-row` 中（电子签名卡片之后）添加水印卡片：

```xml
        <view class="bento-card" bindtap="goToWatermark" style="animation-delay: 0.4s">
          <view class="card-badge">NEW</view>
          <view class="bento-icon bg-sage">
            <t-icon name="shield" size="40rpx" color="#fff"></t-icon>
          </view>
          <text class="bento-name">隐形水印</text>
          <text class="bento-desc">版权保护</text>
        </view>
```

注意：需要将签名安全区的 `bento-row` 调整为两行（每行两个卡片），或者在现有行后追加一个新行。

- [ ] **Step 4: Commit**

```bash
git add app.json pages/toolkit/toolkit.js pages/toolkit/toolkit.wxml
git commit -m "feat(watermark): 注册页面路由并添加工具箱入口卡片"
```
