// 云函数入口 - 图片转 PDF
const cloud = require('wx-server-sdk')
const axios = require('axios')
const PDFDocument = require('pdfkit')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

/**
 * 图片转 PDF 云函数
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { fileList } = event

  try {
    if (!fileList || fileList.length === 0) {
      return {
        success: false,
        message: '请选择要转换的图片'
      }
    }

    // 限制最多 10 张图片
    const images = fileList.slice(0, 10)

    // 下载图片并获取数据
    const imageDataList = []
    for (const fileID of images) {
      try {
        // 获取临时 URL
        const tempUrlResult = await cloud.getTempFileURL({
          fileList: [fileID]
        })

        if (tempUrlResult.fileList && tempUrlResult.fileList.length > 0) {
          const tempUrl = tempUrlResult.fileList[0].tempFileURL

          // 下载图片
          const response = await axios.get(tempUrl, {
            responseType: 'arraybuffer'
          })

          imageDataList.push({
            data: response.data,
            type: response.headers['content-type'] || 'image/jpeg'
          })
        }
      } catch (err) {
        console.error('下载图片失败:', err)
        throw new Error('下载图片失败')
      }
    }

    // 使用 PDFKit 生成 PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50
      }
    })

    const chunks = []
    doc.on('data', chunk => chunks.push(chunk))

    // 添加图片到 PDF
    let isFirstPage = true
    for (const imageData of imageDataList) {
      const pageWidth = doc.page.width - 100
      const pageHeight = doc.page.height - 100

      try {
        // 尝试嵌入图片
        let image
        if (imageData.type.includes('png')) {
          image = doc.openImage(imageData.data, { type: 'png' })
        } else {
          image = doc.openImage(imageData.data, { type: 'jpg' })
        }

        // 计算缩放比例
        const scale = Math.min(pageWidth / image.width, pageHeight / image.height)
        const width = image.width * scale
        const height = image.height * scale

        // 居中放置图片
        const x = (doc.page.width - width) / 2
        const y = (doc.page.height - height) / 2

        // 第一张图使用默认页，之后的先加新页再放图
        if (isFirstPage) {
          doc.image(imageData.data, x, y, { width, height })
          isFirstPage = false
        } else {
          doc.addPage()
          doc.image(imageData.data, x, y, { width, height })
        }
      } catch (err) {
        console.error('添加图片失败:', err)
      }
    }

    doc.end()

    // 等待 PDF 生成完成
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)
    })

    // 上传 PDF 到云存储
    const fileName = `pdf/${OPENID}_${Date.now()}.pdf`
    const uploadResult = await cloud.uploadFile({
      cloudPath: fileName,
      fileContent: pdfBuffer
    })

    // 获取临时 URL
    const urlResult = await cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    })

    const pdfUrl = urlResult.fileList[0].tempFileURL
    const pdfFileId = uploadResult.fileID

    // 删除临时图片
    for (const fileID of images) {
      try {
        await cloud.deleteFile({ fileList: [fileID] })
      } catch (e) {
        console.error('删除临时文件失败:', e)
      }
    }

    return {
      success: true,
      data: {
        pdfFileId,
        pdfUrl
      },
      message: '转换成功'
    }
  } catch (err) {
    console.error('图片转 PDF 失败:', err)
    return {
      success: false,
      error: err.message,
      message: '操作失败'
    }
  }
}
