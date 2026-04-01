// pages/toolkit/vault/vault.js - 绝密保险箱
const app = getApp()

Page({
  data: {
    activeTab: 0,

    // 我的密件
    secretList: [],

    // 新建密件
    showCreate: false,
    createTitle: '',
    createContent: '',
    createKey: '',
    showCreateKey: false,
    creating: false,

    // 查看密件
    showView: false,
    viewTitle: '',
    viewContent: '',

    // 解密
    decryptCiphertext: '',
    decryptKey: '',
    showDecryptKey: false,
    showDecryptResult: false,
    decryptResult: ''
  },

  onLoad() {
    if (!app.requireLogin()) return
  },

  onShow() {
    if (app.globalData.userInfo) {
      this.loadSecrets()
    }
  },

  // 加载密件列表
  loadSecrets() {
    wx.cloud.callFunction({
      name: 'getSecrets',
      success: (res) => {
        if (res.result && res.result.success) {
          const list = res.result.data.map(item => ({
            ...item,
            formattedTime: this.formatDate(item.createTime)
          }))
          this.setData({ secretList: list })
        }
      }
    })
  },

  // 格式化日期
  formatDate(dateStr) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now - date
    const day = 24 * 60 * 60 * 1000
    if (diff < day) return '今天'
    if (diff < 2 * day) return '昨天'
    if (diff < 7 * day) return Math.floor(diff / day) + '天前'
    return (date.getMonth() + 1) + '月' + date.getDate() + '日'
  },

  // Tab 切换
  switchTab(e) {
    this.setData({ activeTab: Number(e.currentTarget.dataset.tab) })
  },

  // ===== 新建密件 =====
  showCreateModal() {
    this.setData({
      showCreate: true,
      createTitle: '',
      createContent: '',
      createKey: ''
    })
  },

  hideCreateModal() {
    this.setData({ showCreate: false })
  },

  onCreateTitleInput(e) { this.setData({ createTitle: e.detail.value }) },
  onCreateContentInput(e) { this.setData({ createContent: e.detail.value }) },
  onCreateKeyInput(e) { this.setData({ createKey: e.detail.value }) },
  toggleCreateKey() { this.setData({ showCreateKey: !this.data.showCreateKey }) },

  // 创建密件
  createSecret() {
    const { createTitle, createContent, createKey } = this.data
    if (!createTitle || !createContent || !createKey) return

    this.setData({ creating: true })
    wx.showLoading({ title: '加密中...' })

    // 第一步：加密
    wx.cloud.callFunction({
      name: 'encryptSecret',
      data: { content: createContent, key: createKey },
      success: (encRes) => {
        if (!encRes.result || !encRes.result.success) {
          wx.hideLoading()
          this.setData({ creating: false })
          wx.showToast({ title: '加密失败', icon: 'none' })
          return
        }

        // 第二步：保存
        wx.cloud.callFunction({
          name: 'saveSecret',
          data: {
            title: createTitle,
            content: createContent,
            ciphertext: encRes.result.ciphertext,
            iv: encRes.result.iv
          },
          success: (saveRes) => {
            wx.hideLoading()
            this.setData({ creating: false })

            if (saveRes.result && saveRes.result.success) {
              wx.showToast({ title: '加密保存成功', icon: 'success' })
              this.setData({ showCreate: false })
              this.loadSecrets()
            } else {
              wx.showToast({ title: '保存失败', icon: 'none' })
            }
          },
          fail: () => {
            wx.hideLoading()
            this.setData({ creating: false })
            wx.showToast({ title: '保存失败', icon: 'none' })
          }
        })
      },
      fail: () => {
        wx.hideLoading()
        this.setData({ creating: false })
        wx.showToast({ title: '加密失败', icon: 'none' })
      }
    })
  },

  // ===== 查看密件 =====
  viewSecret(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.secretList[index]
    // 查看时需要从数据库获取原文，这里列表中不含 content
    // 通过云函数获取单条密件详情
    wx.showLoading({ title: '加载中...' })
    const db = wx.cloud.database()
    db.collection('secrets').doc(item.id).get({
      success: (res) => {
        wx.hideLoading()
        if (res.data) {
          this.setData({
            showView: true,
            viewTitle: res.data.title,
            viewContent: res.data.content
          })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '加载失败', icon: 'none' })
      }
    })
  },

  hideViewModal() {
    this.setData({ showView: false })
  },

  copyViewContent() {
    wx.setClipboardData({
      data: this.data.viewContent,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  // ===== 复制密文 =====
  copyCiphertext(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.secretList[index]

    wx.setClipboardData({
      data: item.ciphertext + '|' + item.iv,
      success: () => {
        wx.showToast({ title: '密文已复制，分享时请同时告知密钥', icon: 'none', duration: 2500 })
      }
    })
  },

  // ===== 删除密件 =====
  deleteSecret(e) {
    const id = e.currentTarget.dataset.id

    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条密件吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '删除中...' })
          wx.cloud.callFunction({
            name: 'deleteSecret',
            data: { id },
            success: (res) => {
              wx.hideLoading()
              if (res.result && res.result.success) {
                wx.showToast({ title: '已删除', icon: 'success' })
                this.loadSecrets()
              } else {
                wx.showToast({ title: '删除失败', icon: 'none' })
              }
            },
            fail: () => {
              wx.hideLoading()
              wx.showToast({ title: '删除失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  // ===== 解密 =====
  onDecryptCiphertextInput(e) { this.setData({ decryptCiphertext: e.detail.value }) },
  onDecryptKeyInput(e) { this.setData({ decryptKey: e.detail.value }) },
  toggleDecryptKey() { this.setData({ showDecryptKey: !this.data.showDecryptKey }) },

  doDecrypt() {
    const { decryptCiphertext, decryptKey } = this.data
    if (!decryptCiphertext || !decryptKey) return

    wx.showLoading({ title: '解密中...' })

    // 从密文中提取 iv（密文格式：base64(ciphertext).base64(iv)）
    // 或者如果密文是纯密文，需要单独的 iv
    // 实际上复制密文时只复制了 ciphertext，需要把 iv 也带上
    // 改为复制时带上 iv：密文格式 "ciphertext|iv"

    // 尝试拆分密文和 iv
    let ciphertext = decryptCiphertext
    let iv = ''
    if (decryptCiphertext.includes('|')) {
      const parts = decryptCiphertext.split('|')
      ciphertext = parts[0]
      iv = parts[1]
    }

    if (!iv) {
      wx.hideLoading()
      wx.showToast({ title: '密文格式不正确', icon: 'none' })
      return
    }

    wx.cloud.callFunction({
      name: 'decryptSecret',
      data: { ciphertext, key: decryptKey, iv },
      success: (res) => {
        wx.hideLoading()
        if (res.result && res.result.success) {
          this.setData({
            showDecryptResult: true,
            decryptResult: res.result.content
          })
        } else {
          wx.showToast({ title: res.result?.error || '解密失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '解密失败', icon: 'none' })
      }
    })
  },

  hideDecryptResult() {
    this.setData({ showDecryptResult: false })
  },

  copyDecryptResult() {
    wx.setClipboardData({
      data: this.data.decryptResult,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  // 返回
  goBack() {
    wx.navigateBack({ delta: 1 })
  }
})
