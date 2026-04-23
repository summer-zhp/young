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

module.exports = {
  encodeLSB: encodeLSB,
  drawVisibleWatermark: drawVisibleWatermark
}
