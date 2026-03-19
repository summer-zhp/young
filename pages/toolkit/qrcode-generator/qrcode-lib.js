// pages/toolkit/qrcode-generator/qrcode-lib.js
/**
 * 二维码生成工具函数
 * 使用 utils/qrcode.js 实现
 */
import qrcode from '../../../utils/qrcode.js'

/**
 * 使用原生 Canvas 2D API 生成二维码
 * @param {Object} options
 * @param {String} options.text - 要编码的文本
 * @param {Number} options.size - 二维码尺寸
 * @param {String} options.foreground - 前景色
 * @param {String} options.background - 背景色
 * @returns {Promise<String>} 图片路径
 */
export function drawQRCode(options) {
  const { text, size = 560, foreground = '#000000', background = '#ffffff' } = options

  return new Promise((resolve, reject) => {
    const query = wx.createSelectorQuery()
    query.select('#hiddenQrcodeCanvas')
      .fields({ node: true })
      .exec((res) => {
        if (!res[0]) {
          reject(new Error('Canvas not found'))
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio
        const canvasSize = size * dpr

        canvas.width = canvasSize
        canvas.height = canvasSize

        try {
          // 使用 qrcode 库生成二维码
          // 设置 UTF-8 编码支持中文
          qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8']
          const qr = qrcode(-1, 'H') // typeNumber: -1 自动选择，errorCorrectionLevel: H 最高纠错
          qr.addData(text)
          qr.make()

          const moduleCount = qr.getModuleCount()
          // 添加 4 个模块的 padding（二维码安静区标准）
          const quietZone = 4
          const totalModules = moduleCount + quietZone * 2
          const cellSize = canvasSize / totalModules

          // 绘制背景
          ctx.fillStyle = background
          ctx.fillRect(0, 0, canvasSize, canvasSize)

          // 绘制二维码模块（带安静区）
          ctx.fillStyle = foreground
          for (let row = 0; row < moduleCount; row++) {
            for (let col = 0; col < moduleCount; col++) {
              if (qr.isDark(row, col)) {
                ctx.fillRect(
                  Math.floor((col + quietZone) * cellSize),
                  Math.floor((row + quietZone) * cellSize),
                  Math.ceil(cellSize),
                  Math.ceil(cellSize)
                )
              }
            }
          }

          // 延迟一下确保绘制完成
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas: canvas,
              width: 0,
              height: 0,
              destWidth: canvasSize,
              destHeight: canvasSize,
              fileType: 'png',
              quality: 1,
              success: (tempRes) => {
                resolve(tempRes.tempFilePath)
              },
              fail: (err) => {
                console.error('canvasToTempFilePath 失败:', err)
                reject(err)
              }
            })
          }, 100)
        } catch (e) {
          console.error('二维码生成失败:', e)
          reject(e)
        }
      })
  })
}
