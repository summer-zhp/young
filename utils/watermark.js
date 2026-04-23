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
  var bitIndex = 0
  var pixelIndex = 0

  for (var byteIndex = 0; byteIndex < payloadLength; byteIndex++) {
    var byte = payload[byteIndex]

    for (var bitPos = 0; bitPos < 8; bitPos++) {
      var bit = (byte >> bitPos) & 1

      // 计算当前像素和通道索引
      var currentPixel = pixelIndex + Math.floor((bitIndex - pixelIndex * 3) / 3)
      var channelOffset = (bitIndex - pixelIndex * 3) % 3

      var dataIdx = currentPixel * 4 + channelOffset

      // 清除 LSB 并设置新位
      imageData[dataIdx] = (imageData[dataIdx] & 0xFE) | bit

      bitIndex++

      // 每3位移动到下一个像素
      if (bitIndex % 3 === 0) {
        pixelIndex++
      }
    }
  }

  return true
}

/**
 * 在 canvas 上绘制可见水印（平铺、旋转、半透明文本）
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

  // 保存当前 canvas 状态
  ctx.save()

  // 设置不透明度
  ctx.globalAlpha = opacity

  // 设置字体和文本样式
  ctx.font = fontSize + 'px sans-serif'
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // 计算对角线长度以确定平铺范围
  var diagonal = Math.sqrt(width * width + height * height)

  // 将原点移到 canvas 中心
  ctx.translate(width / 2, height / 2)

  // 旋转 -45 度
  ctx.rotate(-45 * Math.PI / 180)

  // 将原点移回左上角（现在是旋转后的坐标系）
  ctx.translate(-diagonal / 2, -diagonal / 2)

  // 计算文本尺寸
  var textMetrics = ctx.measureText(text)
  var textWidth = textMetrics.width
  var textHeight = fontSize

  // 计算平铺间距（文本尺寸的1.5倍）
  var spacingX = textWidth * 1.5
  var spacingY = textHeight * 2

  // 计算需要多少行列来覆盖对角线区域
  var cols = Math.ceil(diagonal / spacingX) + 2
  var rows = Math.ceil(diagonal / spacingY) + 2

  // 平铺绘制文本
  for (var row = -1; row < rows; row++) {
    for (var col = -1; col < cols; col++) {
      var x = col * spacingX + spacingX / 2
      var y = row * spacingY + spacingY / 2
      ctx.fillText(text, x, y)
    }
  }

  // 恢复 canvas 状态
  ctx.restore()
}

module.exports = {
  encodeLSB: encodeLSB,
  drawVisibleWatermark: drawVisibleWatermark
}
