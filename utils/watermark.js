/**
 * 水印核心算法模块
 * 提供 LSB 隐写和可见水印绘制功能
 */

/**
 * LSB 隐写：将文本编码到图像像素的最低有效位
 * @param {Uint8ClampedArray} imageData - 图像像素数据 (RGBA 格式)
 * @param {string} text - 要编码的文本
 * @returns {boolean} - 编码成功返回 true，图像太小返回 false
 */
function encodeLSB(imageData, text) {
  if (!imageData || !text) {
    return false
  }

  // 使用 TextEncoder 将文本转换为 UTF-8 字节数组
  var encoder = new TextEncoder()
  var textBytes = encoder.encode(text)

  // 构建二进制负载：[32位长度头 (小端序)] [UTF-8字节] [16位结束标记 0xABCD]
  var dataLength = textBytes.length
  var payloadLength = 4 + dataLength + 2 // 4字节长度 + 数据 + 2字节结束标记

  // 计算需要的像素数量（每个像素存储3位，RGB通道各1位）
  var bitsNeeded = payloadLength * 8
  var pixelsNeeded = Math.ceil(bitsNeeded / 3)

  // 检查图像是否足够大
  var pixelCount = Math.floor(imageData.length / 4)
  if (pixelsNeeded > pixelCount) {
    return false
  }

  // 构建完整的负载数组
  var payload = new Uint8Array(payloadLength)

  // 写入32位长度头（小端序）
  payload[0] = dataLength & 0xFF
  payload[1] = (dataLength >> 8) & 0xFF
  payload[2] = (dataLength >> 16) & 0xFF
  payload[3] = (dataLength >> 24) & 0xFF

  // 写入文本数据
  for (var i = 0; i < dataLength; i++) {
    payload[4 + i] = textBytes[i]
  }

  // 写入16位结束标记 0xABCD（小端序）
  payload[4 + dataLength] = 0xCD
  payload[5 + dataLength] = 0xAB

  // 将位写入像素的 RGB 通道 LSB
  for (var bitIndex = 0; bitIndex < bitsNeeded; bitIndex++) {
    var byteIndex = Math.floor(bitIndex / 8)
    var bitPos = bitIndex % 8
    var bit = (payload[byteIndex] >> bitPos) & 1

    // 计算 pixel 和 channel：每像素 3 bit（R/G/B 各 1 bit）
    var pixelIdx = Math.floor(bitIndex / 3)
    var channelOffset = bitIndex % 3 // 0=R, 1=G, 2=B
    var dataIdx = pixelIdx * 4 + channelOffset

    // 安全检查
    if (dataIdx >= imageData.length) {
      return false
    }

    // 清除 LSB 并设置新位
    imageData[dataIdx] = (imageData[dataIdx] & 0xFE) | bit
  }

  return true
}

/**
 * 在 canvas 右下角绘制可见水印（单个、半透明文本 + 阴影）
 * @param {CanvasRenderingContext2D} ctx - Canvas 上下文
 * @param {number} width - Canvas 宽度
 * @param {number} height - Canvas 高度
 * @param {string} text - 水印文本
 * @param {number} fontSize - 字体大小
 * @param {number} opacity - 不透明度 (0-1)
 */
function drawVisibleWatermark(ctx, width, height, text, fontSize, opacity) {
  if (!ctx || !text) {
    return
  }

  ctx.save()

  ctx.globalAlpha = opacity
  ctx.font = 'bold ' + fontSize + 'px sans-serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'

  // 文字阴影增强可读性
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = fontSize / 3
  ctx.shadowOffsetX = 1
  ctx.shadowOffsetY = 1

  // 右下角绘制，留出边距
  var padding = fontSize * 1.2
  var x = width - padding
  var y = height - padding

  ctx.fillText(text, x, y)

  ctx.restore()
}

/**
 * 基于纹理块复制的图像修复
 * 从已知区域寻找最相似的纹理块直接复制，保留纹理细节
 * @param {Uint8ClampedArray} imageData - 图像像素数据 (RGBA 格式, length = width * height * 4)
 * @param {Uint8Array} mask - 修复掩码 (length = width * height), 1 = 需要填充, 0 = 保持
 * @param {number} width - 图像宽度
 * @param {number} height - 图像高度
 */
function inpaintRegion(imageData, mask, width, height) {
  if (!imageData || !mask || width <= 0 || height <= 0) {
    return
  }

  var w = width
  var h = height
  var totalPixels = w * h

  // 工作数组：0=已知，1=待修复
  var filled = new Uint8Array(totalPixels)
  for (var i = 0; i < totalPixels; i++) {
    filled[i] = mask[i]
  }

  var remainingCount = 0
  for (var i = 0; i < totalPixels; i++) {
    if (filled[i] === 1) remainingCount++
  }
  if (remainingCount === 0) return

  // 搜索半径：只在这个范围内寻找候选纹理块
  var searchRadius = 30
  // 纹理块半径（5x5 邻域比较）
  var patchRadius = 2

  var maxIterations = 500
  var iteration = 0

  while (remainingCount > 0 && iteration < maxIterations) {
    // 收集边界像素
    var boundaryPixels = []
    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = y * w + x
        if (filled[idx] !== 1) continue
        var isBoundary = false
        if (y === 0 || filled[(y - 1) * w + x] === 0) isBoundary = true
        if (!isBoundary && (y === h - 1 || filled[(y + 1) * w + x] === 0)) isBoundary = true
        if (!isBoundary && (x === 0 || filled[y * w + (x - 1)] === 0)) isBoundary = true
        if (!isBoundary && (x === w - 1 || filled[y * w + (x + 1)] === 0)) isBoundary = true
        if (isBoundary) {
          boundaryPixels.push({ x: x, y: y, idx: idx })
        }
      }
    }
    if (boundaryPixels.length === 0) break

    // 对每个边界像素，从已知区域找最相似的纹理块并复制颜色
    for (var i = 0; i < boundaryPixels.length; i++) {
      var bp = boundaryPixels[i]
      var px = bp.x
      var py = bp.y

      // 提取当前像素周围已知像素的上下文
      var bestDist = -1
      var bestSX = -1
      var bestSY = -1

      // 在搜索范围内随机采样候选位置（加快速度）
      var x0 = Math.max(patchRadius, px - searchRadius)
      var x1 = Math.min(w - patchRadius - 1, px + searchRadius)
      var y0 = Math.max(patchRadius, py - searchRadius)
      var y1 = Math.min(h - patchRadius - 1, py + searchRadius)

      // 步长控制：候选区域太大时跳着搜
      var step = 1
      var areaW = x1 - x0
      var areaH = y1 - y0
      if (areaW * areaH > 400) step = 2
      if (areaW * areaH > 2000) step = 3

      for (var sy = y0; sy <= y1; sy += step) {
        for (var sx = x0; sx <= x1; sx += step) {
          var sidx = sy * w + sx
          // 候选像素必须是已知的，且不在待修复区域内
          if (filled[sidx] !== 0) continue

          // 计算纹理块匹配度：比较两个 patch 邻域内已知像素的差异
          var ssd = 0
          var count = 0

          for (var dy = -patchRadius; dy <= patchRadius; dy++) {
            for (var dx = -patchRadius; dx <= patchRadius; dx++) {
              if (dx === 0 && dy === 0) continue

              var bx = px + dx
              var by = py + dy
              var cx = sx + dx
              var cy = sy + dy

              // 两个位置都必须在图像内
              if (bx < 0 || bx >= w || by < 0 || by >= h) continue
              if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue

              // 只比较目标像素邻域中已知的像素
              var bIdx = by * w + bx
              if (filled[bIdx] !== 0) continue

              var cIdx = cy * w + cx
              // 候选邻域像素也必须是已知的
              if (filled[cIdx] !== 0 && mask[cIdx] !== 0) continue

              var bPix = bIdx * 4
              var cPix = cIdx * 4
              var dr = imageData[bPix] - imageData[cPix]
              var dg = imageData[bPix + 1] - imageData[cPix + 1]
              var db = imageData[bPix + 2] - imageData[cPix + 2]
              ssd += dr * dr + dg * dg + db * db
              count++
            }
          }

          if (count >= 3) {
            // 归一化并加入距离惩罚（偏好近处的候选）
            var avgSSD = ssd / count
            var dist = Math.abs(sx - px) + Math.abs(sy - py)
            var score = avgSSD + dist * 2 // 距离惩罚权重

            if (bestDist < 0 || score < bestDist) {
              bestDist = score
              bestSX = sx
              bestSY = sy
            }
          }
        }
      }

      // 如果找到好的匹配，直接复制颜色（保留纹理）
      if (bestSX >= 0) {
        var srcPix = (bestSY * w + bestSX) * 4
        var dstPix = bp.idx * 4
        imageData[dstPix] = imageData[srcPix]
        imageData[dstPix + 1] = imageData[srcPix + 1]
        imageData[dstPix + 2] = imageData[srcPix + 2]
        imageData[dstPix + 3] = imageData[srcPix + 3]
      } else {
        // 兜底：用最近邻域像素的简单平均
        var sumR = 0, sumG = 0, sumB = 0, tw = 0
        for (var dy = -3; dy <= 3; dy++) {
          for (var dx = -3; dx <= 3; dx++) {
            var nx = px + dx, ny = py + dy
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
            var nidx = ny * w + nx
            if (filled[nidx] === 0) {
              var d = Math.sqrt(dx * dx + dy * dy)
              var wt = 1 / (d + 0.1)
              var pp = nidx * 4
              sumR += imageData[pp] * wt
              sumG += imageData[pp + 1] * wt
              sumB += imageData[pp + 2] * wt
              tw += wt
            }
          }
        }
        if (tw > 0) {
          var dstPix = bp.idx * 4
          imageData[dstPix] = sumR / tw
          imageData[dstPix + 1] = sumG / tw
          imageData[dstPix + 2] = sumB / tw
          imageData[dstPix + 3] = 255
        }
      }

      filled[bp.idx] = 0
      remainingCount--
    }
    iteration++
  }

  // 后处理：边界羽化（仅对修复区域与原图交界处做轻微平滑）
  var blurR = 1
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var idx = y * w + x
      if (mask[idx] !== 1) continue

      // 检查是否紧邻原图边界
      var nearEdge = false
      for (var dy = -1; dy <= 1 && !nearEdge; dy++) {
        for (var dx = -1; dx <= 1 && !nearEdge; dx++) {
          var nx = x + dx, ny = y + dy
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            if (mask[ny * w + nx] === 0) nearEdge = true
          }
        }
      }
      if (!nearEdge) continue

      // 轻微混合：80% 原值 + 20% 邻域均值
      var sr = 0, sg = 0, sb = 0, tc = 0
      for (var dy = -blurR; dy <= blurR; dy++) {
        for (var dx = -blurR; dx <= blurR; dx++) {
          var nx = x + dx, ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
          var pp = (ny * w + nx) * 4
          sr += imageData[pp]; sg += imageData[pp + 1]; sb += imageData[pp + 2]; tc++
        }
      }
      if (tc > 0) {
        var pp = idx * 4
        imageData[pp] = imageData[pp] * 0.8 + (sr / tc) * 0.2
        imageData[pp + 1] = imageData[pp + 1] * 0.8 + (sg / tc) * 0.2
        imageData[pp + 2] = imageData[pp + 2] * 0.8 + (sb / tc) * 0.2
      }
    }
  }
}

module.exports = {
  encodeLSB: encodeLSB,
  drawVisibleWatermark: drawVisibleWatermark,
  inpaintRegion: inpaintRegion
}
