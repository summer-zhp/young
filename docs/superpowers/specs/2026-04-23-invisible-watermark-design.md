# 隐形水印/版权保护 - 设计文档

## 概述

为摄影爱好者提供在图片中嵌入水印的功能，支持**可见水印**（平铺半透明文字）和**不可见水印**（LSB 隐写术）两种模式。纯本地 Canvas 实现，无需云函数。

## 入口

- 工具箱页面 `pages/toolkit/toolkit` 的「安全工具」分类中新增「隐形水印」卡片
- 图标：TDesign `shield` 图标，渐变背景与现有工具卡片风格一致

## 页面结构

- 新增页面：`packageB/pages/watermark/watermark`（.js/.json/.wxml/.wxss）
- 在 `app.json` 的 `packageB` sub-package 中注册路径

## 用户流程

```
选择图片 → 输入水印文字 → 选择模式（可见/不可见）
  → 可见模式：调节透明度、字体大小 → 预览效果 → 保存到相册
  → 不可见模式：直接处理 → 保存到相册（外观与原图完全一致）
```

## 可见水印

### 实现

1. Canvas 2D 绘制原图
2. 在上层以 `-45°` 旋转角度平铺半透明水印文字
3. 用户可调节参数：
   - 透明度：默认 15%，范围 5%-50%
   - 文字大小：默认 24px，范围 12px-48px
4. Canvas 实时渲染预览
5. 导出为临时文件 → `wx.saveImageToPhotosAlbum` 保存到相册

### 导出格式

- 可见水印：可导出为 JPEG 或 PNG

## 不可见水印（LSB 隐写术）

### 原理

将水印文字的二进制信息编码到图片像素 RGB 通道的最低有效位（Least Significant Bit）中。人眼无法察觉（颜色变化 < 1/256）。

### 实现

1. 将水印文字 UTF-8 编码为字节数组
2. 添加 32 位长度头（标识信息长度）+ 特定结束标记
3. 遍历图片像素，将每个像素 R/G/B 通道的最低 bit 替换为水印信息的对应 bit
4. 每个像素可携带 3 bit 信息（R/G/B 各 1 bit）

### 容量估算

- 一张 1080×1920 的图片有约 207 万像素，可嵌入约 776 KB 信息
- 远超一般版权文字（几十到几百字节）的需求

### 导出格式

- **必须导出为 PNG**：JPEG 的有损压缩会破坏 LSB 数据
- 导出后提醒用户不要对图片进行有损压缩

### 编码格式

```
[32位长度头(小端序)] [UTF-8编码的水印文字字节] [16位结束标记 0xABCD]
```

## UI 设计

### 布局

1. **顶部**：图片选择区域（点击选择图片），参考 image2pdf 的上传区风格
2. **模式切换**：Tab 式切换「可见水印」/「不可见水印」
3. **输入区**：水印文字输入框（最多 200 字符）
4. **参数区**（仅可见模式）：
   - 透明度滑块
   - 文字大小滑块
5. **预览区**：图片预览（可见模式显示效果图，不可见模式显示原图）
6. **底部**：保存按钮（固定底部）

### 样式

- 遵循 `styles/theme.wxss` 设计系统
- 主色调：薄荷绿 `#8EC5B9`
- 圆角、阴影与现有工具页面保持一致
- 使用 TDesign 组件（slider、input 等）

## 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `packageB/pages/watermark/watermark.js` | 新增 | 页面逻辑 |
| `packageB/pages/watermark/watermark.json` | 新增 | 页面配置 |
| `packageB/pages/watermark/watermark.wxml` | 新增 | 页面模板 |
| `packageB/pages/watermark/watermark.wxss` | 新增 | 页面样式 |
| `utils/watermark.js` | 新增 | 水印核心算法（LSB 编码 + 可见水印绘制） |
| `pages/toolkit/toolkit.js` | 修改 | 新增导航方法 |
| `pages/toolkit/toolkit.wxml` | 修改 | 新增工具卡片 |
| `app.json` | 修改 | 注册新页面路径 |

## 技术要点

- 使用新版 Canvas 2D API（`<canvas type="2d">`），与项目现有 image-editor 保持一致
- 像素操作通过 `canvas.getImageData()` / `canvas.putImageData()`
- 注意设备像素比（`dpr`）处理，确保 Canvas 渲染清晰
- 大图片处理时添加 loading 提示
- `wx.saveImageToPhotosAlbum` 需要用户授权，做好权限引导
- PNG 导出时注意 `canvas.toTempFilePath` 的 `fileType` 参数设为 `png`

## 用户体验注意事项

- 不可见水印保存后提示用户：「水印已嵌入，请以 PNG 格式分享以保护水印不被破坏」
- 可见水印提供实时预览，所见即所得
- 处理中显示加载动画
