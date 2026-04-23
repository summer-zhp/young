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

  // 创建工作数组，复制掩码
  var remaining = new Uint8Array(totalPixels)
  for (var i = 0; i < totalPixels; i++) {
    remaining[i] = mask[i]
  }

  // 统计待修复像素数量
  var remainingCount = 0
  for (var i = 0; i < totalPixels; i++) {
    if (remaining[i] === 1) {
      remainingCount++
    }
  }

  // 如果没有需要修复的像素，直接返回
  if (remainingCount === 0) {
    return
  }

  var maxIterations = 500
  var iteration = 0

  // 迭代修复
  while (remainingCount > 0 && iteration < maxIterations) {
    // 收集边界像素
    var boundaryPixels = []

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var idx = y * w + x

        // 只处理待修复的像素
        if (remaining[idx] !== 1) {
          continue
        }

        // 检查4连通邻域是否有已知像素
        var isBoundary = false

        // 上
        if (y === 0 || remaining[(y - 1) * w + x] === 0) {
          isBoundary = true
        }
        // 下
        if (!isBoundary && (y === h - 1 || remaining[(y + 1) * w + x] === 0)) {
          isBoundary = true
        }
        // 左
        if (!isBoundary && (x === 0 || remaining[y * w + (x - 1)] === 0)) {
          isBoundary = true
        }
        // 右
        if (!isBoundary && (x === w - 1 || remaining[y * w + (x + 1)] === 0)) {
          isBoundary = true
        }

        if (isBoundary) {
          boundaryPixels.push({ x: x, y: y, idx: idx })
        }
      }
    }

    // 如果没有边界像素，说明是孤立区域，退出
    if (boundaryPixels.length === 0) {
      break
    }

    // 修复每个边界像素
    for (var i = 0; i < boundaryPixels.length; i++) {
      var bp = boundaryPixels[i]
      var x = bp.x
      var y = bp.y

      // 在半径3像素内采样已知像素
      var radius = 3
      var sumR = 0
      var sumG = 0
      var sumB = 0
      var sumA = 0
      var totalWeight = 0

      for (var dy = -radius; dy <= radius; dy++) {
        for (var dx = -radius; dx <= radius; dx++) {
          var nx = x + dx
          var ny = y + dy

          // 边界检查
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
            continue
          }

          var nidx = ny * w + nx

          // 只使用已知像素
          if (remaining[nidx] === 0) {
            var distance = Math.sqrt(dx * dx + dy * dy)
            var weight = 1 / (distance + 0.1)

            var pixelIdx = nidx * 4
            sumR += imageData[pixelIdx] * weight
            sumG += imageData[pixelIdx + 1] * weight
            sumB += imageData[pixelIdx + 2] * weight
            sumA += imageData[pixelIdx + 3] * weight
            totalWeight += weight
          }
        }
      }

      // 计算加权平均值并写入
      if (totalWeight > 0) {
        var pixelIdx = bp.idx * 4
        imageData[pixelIdx] = sumR / totalWeight
        imageData[pixelIdx + 1] = sumG / totalWeight
        imageData[pixelIdx + 2] = sumB / totalWeight
        imageData[pixelIdx + 3] = sumA / totalWeight
      }

      // 标记为已填充
      remaining[bp.idx] = 0
      remainingCount--
    }

    iteration++
  }
}

module.exports = {
  encodeLSB: encodeLSB,
  drawVisibleWatermark: drawVisibleWatermark,
  inpaintRegion: inpaintRegion
}
