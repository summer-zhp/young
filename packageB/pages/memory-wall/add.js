// packageB/pages/memory-wall/add.js
const { cloud } = require('../../../utils/cloud')

Page({
  data: {
    images: [],       // 本地临时路径
    text: '',
    locationEnabled: false,
    location: null,   // { name, address, latitude, longitude }
    saving: false,
    maxImages: 9
  },

  chooseImage() {
    const remaining = this.data.maxImages - this.data.images.length
    if (remaining <= 0) {
      wx.showToast({ title: `最多选择${this.data.maxImages}张图片`, icon: 'none' })
      return
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const newImages = res.tempFiles.map(file => file.tempFilePath)
        this.setData({
          images: [...this.data.images, ...newImages]
        })
      }
    })
  },

  removeImage(e) {
    const { index } = e.currentTarget.dataset
    const images = [...this.data.images]
    images.splice(index, 1)
    this.setData({ images })
  },

  previewImage(e) {
    const { url } = e.currentTarget.dataset
    wx.previewImage({
      current: url,
      urls: this.data.images
    })
  },

  onTextInput(e) {
    this.setData({ text: e.detail.value })
  },

  toggleLocation(e) {
    const enabled = e.detail.value
    this.setData({ locationEnabled: enabled })

    if (enabled) {
      this.getLocation()
    } else {
      this.setData({ location: null })
    }
  },

  getLocation() {
    wx.showLoading({ title: '获取位置中...' })

    wx.getSetting({
      success: (settingRes) => {
        if (!settingRes.authSetting['scope.userLocation']) {
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              wx.hideLoading()
              this._openLocationPicker()
            },
            fail: () => {
              wx.hideLoading()
              wx.showModal({
                title: '需要位置权限',
                content: '请在设置中开启位置权限以获取当前位置',
                confirmText: '去设置',
                success: (res) => {
                  if (res.confirm) {
                    wx.openSetting()
                  }
                  this.setData({ locationEnabled: false })
                }
              })
            }
          })
        } else {
          wx.hideLoading()
          this._openLocationPicker()
        }
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ locationEnabled: false, location: null })
      }
    })
  },

  _openLocationPicker() {
    wx.chooseLocation({
      type: 'gcj02',
      success: (locRes) => {
        this.setData({
          location: {
            name: locRes.name || '当前位置',
            address: locRes.address || '',
            latitude: locRes.latitude,
            longitude: locRes.longitude
          }
        })
      },
      fail: (err) => {
        if (err.errMsg && err.errMsg.includes('cancel')) {
          this.setData({ locationEnabled: false, location: null })
        } else {
          wx.showToast({ title: '获取位置失败', icon: 'none' })
          this.setData({ locationEnabled: false, location: null })
        }
      }
    })
  },

  async save() {
    const { images, text, location } = this.data

    if (images.length === 0 && !text.trim()) {
      wx.showToast({ title: '请至少添加一张图片或一段文字', icon: 'none' })
      return
    }

    this.setData({ saving: true })
    wx.showLoading({ title: '保存中...' })

    try {
      // 上传图片到云存储
      const imageFileIDs = []
      for (let i = 0; i < images.length; i++) {
        const ext = images[i].split('.').pop() || 'jpg'
        const cloudPath = `memories/${Date.now()}_${Math.random().toString(36).substr(2, 8)}_${i}.${ext}`
        const fileID = await cloud.uploadFile(images[i], cloudPath)
        imageFileIDs.push(fileID)
      }

      // 保存记录
      const res = await cloud.callFunction('saveMemory', {
        text: text.trim(),
        imageFileIDs,
        location: location || null
      })

      wx.hideLoading()

      if (res.success) {
        wx.showToast({ title: '保存成功', icon: 'success' })
        setTimeout(() => {
          wx.navigateBack()
        }, 800)
      } else {
        wx.showToast({ title: res.error || '保存失败', icon: 'none' })
        this.setData({ saving: false })
      }
    } catch (err) {
      wx.hideLoading()
      console.error('保存纪念失败:', err)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
      this.setData({ saving: false })
    }
  }
})
