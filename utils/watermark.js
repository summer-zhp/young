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
 * 边界优先迭代修复：修复指定区域的像素
 * 使用方向射线采样 + 加权混合，减少模糊累积
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

  // 创建工作数组：0=已知, 1=原始待修复, 2=已填充(本轮)
  var filled = new Uint8Array(totalPixels)
  for (var i = 0; i < totalPixels; i++) {
    filled[i] = mask[i]
  }

  // 统计待修复像素数量
  var remainingCount = 0
  for (var i = 0; i < totalPixels; i++) {
    if (filled[i] === 1) {
      remainingCount++
    }
  }

  if (remainingCount === 0) {
    return
  }

  // 8 个方向的射线方向向量
  var dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
    { dx: 1, dy: 1 },
    { dx: -1, dy: 1 },
    { dx: 1, dy: -1 },
    { dx: -1, dy: -1 }
  ]

  var maxIterations = 500
  var sampleRadius = 9

  var iteration = 0
  while (remainingCount > 0 && iteration < maxIterations) {
    // 收集边界像素（与已知像素相邻的待修复像素）
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

    // 修复每个边界像素
    for (var i = 0; i < boundaryPixels.length; i++) {
      var bp = boundaryPixels[i]
      var px = bp.x
      var py = bp.y

      // 方法1：方向射线采样 - 沿8个方向寻找最近的已知像素
      var dirR = 0, dirG = 0, dirB = 0, dirA = 0, dirCount = 0

      for (var d = 0; d < dirs.length; d++) {
        var ddx = dirs[d].dx
        var ddy = dirs[d].dy
        // 沿射线方向搜索，找最近的已知像素
        for (var step = 1; step <= sampleRadius; step++) {
          var sx = px + ddx * step
          var sy = py + ddy * step
          if (sx < 0 || sx >= w || sy < 0 || sy >= h) break

          var sidx = sy * w + sx
          if (filled[sidx] === 0) {
            // 找到已知像素，距离越近权重越高
            var pixIdx = sidx * 4
            var weight = 1 / step
            dirR += imageData[pixIdx] * weight
            dirG += imageData[pixIdx + 1] * weight
            dirB += imageData[pixIdx + 2] * weight
            dirA += imageData[pixIdx + 3] * weight
            dirCount += weight
            break
          }
        }
      }

      // 方法2：邻域加权采样（用于补充方向射线的不足）
      var sumR = 0, sumG = 0, sumB = 0, sumA = 0, totalWeight = 0
      for (var dy = -sampleRadius; dy <= sampleRadius; dy++) {
        for (var dx = -sampleRadius; dx <= sampleRadius; dx++) {
          var nx = px + dx
          var ny = py + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue

          var nidx = ny * w + nx
          if (filled[nidx] === 0) {
            var distance = Math.sqrt(dx * dx + dy * dy)
            if (distance > sampleRadius) continue
            // 高斯权重
            var gWeight = Math.exp(-distance * distance / (sampleRadius * sampleRadius * 0.5))
            var pixIdx = nidx * 4
            sumR += imageData[pixIdx] * gWeight
            sumG += imageData[pixIdx + 1] * gWeight
            sumB += imageData[pixIdx + 2] * gWeight
            sumA += imageData[pixIdx + 3] * gWeight
            totalWeight += gWeight
          }
        }
      }

      // 混合：方向采样占 40%，邻域采样占 60%
      var finalR, finalG, finalB, finalA
      if (dirCount > 0 && totalWeight > 0) {
        finalR = (dirR / dirCount) * 0.4 + (sumR / totalWeight) * 0.6
        finalG = (dirG / dirCount) * 0.4 + (sumG / totalWeight) * 0.6
        finalB = (dirB / dirCount) * 0.4 + (sumB / totalWeight) * 0.6
        finalA = (dirA / dirCount) * 0.4 + (sumA / totalWeight) * 0.6
      } else if (dirCount > 0) {
        finalR = dirR / dirCount
        finalG = dirG / dirCount
        finalB = dirB / dirCount
        finalA = dirA / dirCount
      } else if (totalWeight > 0) {
        finalR = sumR / totalWeight
        finalG = sumG / totalWeight
        finalB = sumB / totalWeight
        finalA = sumA / totalWeight
      } else {
        // 无采样数据，跳过
        iteration++
        continue
      }

      var pixelIdx = bp.idx * 4
      imageData[pixelIdx] = finalR
      imageData[pixelIdx + 1] = finalG
      imageData[pixelIdx + 2] = finalB
      imageData[pixelIdx + 3] = finalA

      filled[bp.idx] = 0
      remainingCount--
    }

    iteration++
  }

  // 后处理：边界羽化平滑
  // 对修复区域边缘2-3像素做轻微模糊，消除填充区域与原图的过渡痕迹
  var blurRadius = 2
  // 找到边界像素（原来是 mask=1 的区域，且与 mask=0 相邻）
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var idx = y * w + x
      if (mask[idx] !== 1) continue

      // 检查是否在边界附近
      var nearEdge = false
      for (var dy = -blurRadius; dy <= blurRadius && !nearEdge; dy++) {
        for (var dx = -blurRadius; dx <= blurRadius && !nearEdge; dx++) {
          var nx = x + dx
          var ny = y + dy
          if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
            if (mask[ny * w + nx] === 0) {
              nearEdge = true
            }
          }
        }
      }

      if (!nearEdge) continue

      // 对边界附近像素做轻微混合
      var sumR = 0, sumG = 0, sumB = 0, totalW = 0
      for (var dy = -blurRadius; dy <= blurRadius; dy++) {
        for (var dx = -blurRadius; dx <= blurRadius; dx++) {
          var nx = x + dx
          var ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
          var distance = Math.sqrt(dx * dx + dy * dy)
          if (distance > blurRadius) continue
          var bWeight = Math.exp(-distance * distance / (blurRadius * blurRadius * 0.5))
          var pixIdx = (ny * w + nx) * 4
          sumR += imageData[pixIdx] * bWeight
          sumG += imageData[pixIdx + 1] * bWeight
          sumB += imageData[pixIdx + 2] * bWeight
          totalW += bWeight
        }
      }

      if (totalW > 0) {
        // 混合比例：70% 平滑值 + 30% 原值，避免过度模糊
        var pixIdx = idx * 4
        imageData[pixIdx] = imageData[pixIdx] * 0.3 + (sumR / totalW) * 0.7
        imageData[pixIdx + 1] = imageData[pixIdx + 1] * 0.3 + (sumG / totalW) * 0.7
        imageData[pixIdx + 2] = imageData[pixIdx + 2] * 0.3 + (sumB / totalW) * 0.7
      }
    }
  }
}

module.exports = {
  encodeLSB: encodeLSB,
  drawVisibleWatermark: drawVisibleWatermark,
  inpaintRegion: inpaintRegion
}
