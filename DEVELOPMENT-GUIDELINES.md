# 微信小程序项目开发规范

## 项目信息

| 项目 | 说明 |
|------|------|
| **项目名称** | 摸鱼治愈所 |
| **项目类型** | 原生微信小程序 |
| **后端服务** | 微信云开发（CloudBase） |
| **框架版本** | 小程序基础库 2.19.0+ |
| **运行环境** | 微信 iOS/Android 客户端 |

---

## 技术栈

### 前端技术
- **开发语言**: JavaScript (ES6+)
- **框架**: 原生微信小程序框架
- **样式**: WXSS + 自定义 CSS 变量
- **状态管理**: 小程序全局数据 + 自定义事件

### 后端技术
- **云环境**: 微信云开发
- **云函数**: Node.js 16+
- **数据库**: 云开发数据库 (MongoDB)
- **存储**: 云存储 (CDN 加速)

---

## 目录结构

```
miniprogram/
├── app.js                      # 小程序入口文件
├── app.json                    # 全局配置
├── app.wxss                    # 全局样式
├── sitemap.json                # 索引配置
│
├── pages/                      # 页面目录
│   ├── index/                  # 首页 - 今日治愈
│   │   ├── index.js
│   │   ├── index.json
│   │   ├── index.wxml
│   │   └── index.wxss
│   │
│   ├── breathe/                # 呼吸练习页
│   │   ├── breathe.js
│   │   ├── breathe.json
│   │   ├── breathe.wxml
│   │   └── breathe.wxss
│   │
│   ├── toys/                   # 解压玩具页
│   │   ├── toys.js
│   │   ├── toys.json
│   │   ├── toys.wxml
│   │   └── toys.wxss
│   │
│   ├── sounds/                 # 白噪音页
│   │   ├── sounds.js
│   │   ├── sounds.json
│   │   ├── sounds.wxml
│   │   └── sounds.wxss
│   │
│   └── profile/                # 个人中心
│       ├── profile.js
│       ├── profile.json
│       ├── profile.wxml
│       └── profile.wxss
│
├── components/                 # 自定义组件
│   ├── healing-card/           # 治愈卡片组件
│   │   ├── healing-card.js
│   │   ├── healing-card.json
│   │   ├── healing-card.wxml
│   │   └── healing-card.wxss
│   │
│   ├── breathing-circle/       # 呼吸引导组件
│   │   └── ...
│   │
│   ├── bubble-paper/           # 泡泡纸组件
│   │   └── ...
│   │
│   └── audio-player/           # 音频播放器组件
│       └── ...
│
├── utils/                      # 工具函数
│   ├── cloud.js                # 云开发封装
│   ├── audio.js                # 音频管理
│   ├── common.js               # 通用工具
│   └── constants.js            # 常量配置
│
├── images/                     # 静态图片资源
│   ├── icons/                  # 图标
│   ├── backgrounds/            # 背景图
│   └── logo.png                # Logo
│
└── styles/                     # 全局样式片段
    ├── variables.wxss          # CSS 变量
    ├── mixins.wxss             # 混入样式
    └── reset.wxss              # 重置样式
```

```
cloudfunctions/                 # 云函数目录 (独立于 miniprogram)
├── getDailyContent/            # 获取每日治愈内容
│   ├── index.js
│   ├── package.json
│   └── config.json
│
├── getContentList/             # 获取内容列表
│   └── ...
│
├── getUserFavorites/           # 获取用户收藏
│   └── ...
│
├── addToFavorites/             # 添加收藏
│   └── ...
│
├── removeFromFavorites/        # 取消收藏
│   └── ...
│
└── recordMood/                 # 记录心情
    └── ...
```

---

## 开发规范

### 命名规范

#### 文件命名
- **页面文件**: 小写 + 连字符 (如 `healing-card.wxml`)
- **组件文件**: 小写 + 连字符 (如 `bubble-paper.js`)
- **工具函数**: 小写 (如 `cloud.js`)

#### 变量命名
```javascript
// 常量 - 大写下划线
const MAX_RETRY_COUNT = 3
const DEFAULT_AUDIO_VOLUME = 0.8

// 变量 - 小驼峰
let isLoading = false
const userInfo = {}

// 函数 - 小驼峰
function getUserInfo() {}
const handleTap = () => {}

// 类 - 大驼峰
class AudioPlayer {}

// 组件 - 大驼峰
const HealingCard = Component({})
```

#### WXML 命名
```xml
<!-- class: 小写 + 连字符 -->
<view class="healing-card">
  <text class="card-content">{{ content }}</text>
</view>

<!-- id: 小写 + 下划线 (仅唯一元素) -->
<view id="breathing_circle"></view>

<!-- 数据绑定: 小驼峰 -->
<view data-item-id="{{ itemId }}"></view>
```

---

### 代码风格

#### JavaScript 规范
```javascript
// ✅ 使用 const/let，不用 var
const name = '摸鱼治愈所'
let count = 0

// ✅ 使用箭头函数
const handleClick = () => {
  console.log('clicked')
}

// ✅ 使用模板字符串
const message = `欢迎来到${appName}`

// ✅ 对象属性简写
const user = { name, age }

// ✅ 解构赋值
const { name, age } = userInfo

// ✅ 可选链操作符
const userName = user?.profile?.name

// ✅ 异步使用 async/await
const fetchData = async () => {
  try {
    const res = await wx.cloud.callFunction({ name: 'getData' })
    return res.result
  } catch (error) {
    console.error(error)
    throw error
  }
}
```

#### 页面结构规范
```javascript
// pages/index/index.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    dailyContent: null,
    isLoading: false,
    isError: false
  },

  /**
   * 生命周期函数 - 监听页面加载
   */
  onLoad(options) {
    this.fetchDailyContent()
  },

  /**
   * 页面相关事件处理函数
   */
  async fetchDailyContent() {
    this.setData({ isLoading: true })
    try {
      const res = await wx.cloud.callFunction({
        name: 'getDailyContent'
      })
      this.setData({
        dailyContent: res.result.data,
        isLoading: false
      })
    } catch (error) {
      console.error('获取失败:', error)
      this.setData({
        isError: true,
        isLoading: false
      })
    }
  },

  /**
   * 用户交互事件处理
   */
  onCollectTap() {
    const { dailyContent } = this.data
    if (!dailyContent) return
    this.addToFavorites(dailyContent._id)
  },

  /**
   * 工具方法 - 以下划线开头区分
   */
  _formatDate(date) {
    return date.getFullYear() + '-' + (date.getMonth() + 1)
  }
})
```

---

### 云开发规范

#### 云函数结构
```javascript
// cloudfunctions/getDailyContent/index.js
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

/**
 * 获取每日治愈内容
 * @description 随机返回一条可展示的治愈内容
 */
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    // 获取今日日期作为种子
    const today = new Date()
    const dateStr = today.toISOString().split('T')[0]

    // 从数据库中随机获取一条内容
    const result = await db.collection('healing_content')
      .where({
        is_featured: true
      })
      .orderBy('view_count', 'asc')
      .limit(1)
      .get()

    // 增加浏览次数
    if (result.data.length > 0) {
      await db.collection('healing_content')
        .doc(result.data[0]._id)
        .update({
          view_count: _.inc(1)
        })
    }

    return {
      success: true,
      data: result.data[0] || null,
      date: dateStr
    }
  } catch (error) {
    console.error('获取内容失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
```

#### 云函数 package.json
```json
{
  "name": "getDailyContent",
  "version": "1.0.0",
  "description": "获取每日治愈内容",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

#### 云函数调用封装
```javascript
// utils/cloud.js
const callFunction = async (name, data = {}) => {
  try {
    const res = await wx.cloud.callFunction({
      name,
      data
    })

    if (res.result.success) {
      return res.result.data
    } else {
      throw new Error(res.result.error || '云函数调用失败')
    }
  } catch (error) {
    console.error(`云函数 ${name} 调用失败:`, error)
    throw error
  }
}

module.exports = {
  callFunction
}
```

---

### 数据库规范

#### 集合命名
- 使用小写 + 下划线 (如 `healing_content`, `user_favorites`)

#### 字段规范
```javascript
// 必填字段
{
  _id: "auto_generated",      // 自动生成
  _create_time: Date,         // 创建时间 (云开发自动添加)
  _update_time: Date          // 更新时间 (云开发自动添加)
}

// 通用字段规范
{
  created_at: Date,           // 业务创建时间
  updated_at: Date,           // 业务更新时间
  is_deleted: false,          // 软删除标记
  view_count: 0,              // 浏览次数
  sort_order: 0               // 排序权重
}
```

#### 索引设计
```javascript
// healing_content 集合索引
db.collection('healing_content').createIndex({
  is_featured: 1,
  created_at: -1
})

// user_favorites 集合索引
db.collection('user_favorites').createIndex({
  _openid: 1,
  created_at: -1
})
```

#### 查询规范
```javascript
// ✅ 使用云数据库命令
const _ = db.command

// 条件查询
const result = await db.collection('healing_content')
  .where({
    is_featured: true,
    category: _.in(['work', 'life'])
  })
  .orderBy('created_at', 'desc')
  .limit(10)
  .get()

// 聚合查询
const result = await db.collection('healing_content')
  .aggregate()
  .match({ is_featured: true })
  .sort({ view_count: -1 })
  .limit(10)
  .end()
```

---

### 样式规范

#### CSS 变量定义
```wxss
/* app.wxss */
page {
  /* 主题色 */
  --primary-color: #8EC5B9;
  --primary-light: #A8D8CC;
  --primary-dark: #6FA99A;

  /* 辅助色 */
  --accent-color: #FFB5A9;
  --background-color: #F7E8D8;
  --card-background: #FFFFFF;

  /* 文字色 */
  --text-primary: #4A4A4A;
  --text-secondary: #888888;
  --text-placeholder: #CCCCCC;

  /* 间距 */
  --spacing-xs: 4rpx;
  --spacing-sm: 8rpx;
  --spacing-md: 16rpx;
  --spacing-lg: 24rpx;
  --spacing-xl: 32rpx;

  /* 圆角 */
  --radius-sm: 4rpx;
  --radius-md: 8rpx;
  --radius-lg: 16rpx;
  --radius-xl: 24rpx;

  /* 阴影 */
  --shadow-sm: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
  --shadow-lg: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
}
```

#### 混入样式
```wxss
/* styles/mixins.wxss */
@import './variables.wxss';

/* 弹性布局居中 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 文字省略 */
.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 卡片样式 */
.card {
  background-color: var(--card-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
}
```

---

### 性能优化规范

#### 图片优化
- 使用 WebP 格式 (兼容性允许时)
- 图片大小控制在 100KB 以内
- 使用云存储 CDN 加速
- 列表页使用缩略图

#### 数据优化
- 分页加载，每页不超过 20 条
- 使用本地缓存减少请求
- 云函数添加结果缓存

#### 代码优化
- 使用分包加载 (后期功能增多时)
- 避免在 onScroll 中频繁 setData
- 使用防抖/节流处理高频事件

---

### 安全规范

#### 云函数权限
```json
// cloudfunctions/*/config.json
{
  "permissions": {
    "openapi": []
  },
  "timeout": 5,
  "envVariables": {},
  "triggerConfig": {}
}
```

#### 数据库权限
```javascript
// 数据库权限设置 (控制台配置)
// 仅创建者可写，所有人可读 (公开内容)
{
  "read": true,
  "write": "auth.openid == doc._openid"
}
```

#### 敏感信息
- ❌ 禁止在代码中硬编码 AppID、Secret
- ✅ 使用云开发自动鉴权
- ✅ 敏感操作在云函数中进行权限校验

---

### 提交规范

#### Git Commit 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型
| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | Bug 修复 |
| docs | 文档更新 |
| style | 代码格式调整 |
| refactor | 重构 |
| test | 测试相关 |
| chore | 构建/工具配置 |

#### 示例
```
feat(index): 添加今日治愈功能

- 实现每日随机内容获取
- 添加收藏功能
- 优化卡片展示效果

Closes #1
```

---

## 配置文件

### app.json
```json
{
  "pages": [
    "pages/index/index",
    "pages/breathe/breathe",
    "pages/toys/toys",
    "pages/sounds/sounds",
    "pages/profile/profile"
  ],
  "window": {
    "backgroundColor": "#F7E8D8",
    "backgroundTextStyle": "dark",
    "navigationBarBackgroundColor": "#8EC5B9",
    "navigationBarTitleText": "摸鱼治愈所",
    "navigationBarTextStyle": "white"
  },
  "tabBar": {
    "color": "#999999",
    "selectedColor": "#8EC5B9",
    "backgroundColor": "#FFFFFF",
    "borderStyle": "black",
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页",
        "iconPath": "images/icons/home.png",
        "selectedIconPath": "images/icons/home-active.png"
      },
      {
        "pagePath": "pages/breathe/breathe",
        "text": "呼吸",
        "iconPath": "images/icons/breathe.png",
        "selectedIconPath": "images/icons/breathe-active.png"
      },
      {
        "pagePath": "pages/toys/toys",
        "text": "玩具",
        "iconPath": "images/icons/toys.png",
        "selectedIconPath": "images/icons/toys-active.png"
      },
      {
        "pagePath": "pages/sounds/sounds",
        "text": "声音",
        "iconPath": "images/icons/sounds.png",
        "selectedIconPath": "images/icons/sounds-active.png"
      }
    ]
  },
  "cloud": true,
  "sitemapLocation": "sitemap.json",
  "lazyCodeLoading": "requiredComponents"
}
```

### project.config.json
```json
{
  "miniprogramRoot": "miniprogram/",
  "cloudfunctionRoot": "cloudfunctions/",
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": true,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "lazycodePlaceholder": false,
    "useDataPool": false
  },
  "appid": "你的小程序 AppID",
  "projectname": "摸鱼治愈所",
  "libVersion": "2.19.0",
  "simulatorType": "wechat",
  "simulatorPluginLibVersion": {},
  "cloudfunctionTemplateRoot": "cloudfunctionTemplate/",
  "condition": {}
}
```

---

## 开发工具

### 推荐工具
- **微信开发者工具**: 官方 IDE
- **VS Code**: 代码编辑器
- **TortoiseGit / SourceTree**: Git 图形化客户端

### VS Code 插件推荐
- WXML - 微信小程序语法高亮
- Wechat Snippet - 微信小程序代码片段
- ESLint - 代码检查
- Prettier - 代码格式化

---

## 文档更新记录

| 版本 | 日期 | 更新人 | 更新内容 |
|------|------|--------|----------|
| v1.0 | 2026-03-12 | - | 初始版本 |

---

## 附录

### 常用小程序 API
```javascript
// 网络请求
wx.request()
wx.cloud.callFunction()

// 媒体
wx.chooseImage()
wx.playVoice()
wx.getBackgroundAudioManager()

// 存储
wx.setStorageSync()
wx.getStorageSync()

// 界面
wx.showToast()
wx.showLoading()
wx.showModal()
wx.navigateBack()
wx.switchTab()

// 设备
wx.getSystemInfoSync()
wx.getNetworkType()
```

### 云开发常用 API
```javascript
// 初始化
wx.cloud.init()

// 数据库
const db = wx.cloud.database()
db.collection('xxx').add()
db.collection('xxx').doc().get()
db.collection('xxx').doc().update()
db.collection('xxx').doc().remove()
db.collection('xxx').where().get()

// 云函数
wx.cloud.callFunction()

// 存储
wx.cloud.uploadFile()
wx.cloud.downloadFile()
wx.cloud.getTempFileURL()
```
