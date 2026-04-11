# 微信运动步数可视化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在放松页添加"微信运动"入口，展示用户过去31天微信运动步数，以柱状图+折线图可视化，并提供统计摘要和每日明细列表。

**Architecture:** 使用云函数通过 cloudID 解密 wx.getWeRunData 返回的加密步数数据，前端使用 Canvas 2D API 自绘柱状图和折线图。授权流程通过 wx.getSetting + wx.authorize 处理。

**Tech Stack:** 微信小程序原生开发、Canvas 2D API、wx-server-sdk 云函数、TDesign 图标组件

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `cloudfunctions/getWeRunData/index.js` | 云函数：通过 cloudID 解密步数数据 |
| Create | `cloudfunctions/getWeRunData/package.json` | 云函数依赖声明 |
| Create | `packageA/pages/werun/werun.js` | 页面逻辑：授权、数据获取、图表绘制 |
| Create | `packageA/pages/werun/werun.wxml` | 页面模板：统计卡片、图表、步数列表 |
| Create | `packageA/pages/werun/werun.wxss` | 页面样式：遵循项目设计系统 |
| Create | `packageA/pages/werun/werun.json` | 页面配置 |
| Modify | `pages/toolbox/toolbox.js` | 添加"微信运动"工具卡片入口 |
| Modify | `app.json` | 注册新分包页面路由 |

---

### Task 1: 创建云函数 getWeRunData

**Files:**
- Create: `cloudfunctions/getWeRunData/index.js`
- Create: `cloudfunctions/getWeRunData/package.json`

- [ ] **Step 1: 创建云函数 package.json**

创建 `cloudfunctions/getWeRunData/package.json`：

```json
{
  "name": "getWeRunData",
  "version": "1.0.0",
  "description": "获取微信运动步数数据",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "~2.6.3"
  }
}
```

- [ ] **Step 2: 创建云函数 index.js**

创建 `cloudfunctions/getWeRunData/index.js`：

```js
// 云函数入口 - 获取微信运动步数数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()

  try {
    if (!event.cloudID) {
      return {
        success: false,
        message: '缺少 cloudID 参数'
      }
    }

    // 通过 cloudID 获取开放数据（云开发自动解密）
    const result = await cloud.openapi.werun.getOpenData({
      list: [event.cloudID]
    })

    if (!result || !result.list || !result.list.length) {
      return {
        success: false,
        message: '获取运动数据失败'
      }
    }

    const openData = result.list[0]
    if (openData.errcode || !openData.data) {
      return {
        success: false,
        message: openData.errmsg || '数据解密失败'
      }
    }

    // 解析步数数据
    const stepData = JSON.parse(openData.data)
    const stepInfoList = stepData.stepInfoList || []

    return {
      success: true,
      stepInfoList
    }
  } catch (err) {
    console.error('获取微信运动数据失败:', err)
    return {
      success: false,
      message: '获取运动数据失败',
      error: err.message
    }
  }
}
```

- [ ] **Step 3: 提交云函数代码**

```bash
git add cloudfunctions/getWeRunData/
git commit -m "feat(werun): 添加 getWeRunData 云函数"
```

> **验证：** 在微信开发者工具中右键 `getWeRunData` → 上传并部署，确保云函数上传成功。

---

### Task 2: 注册页面路由

**Files:**
- Modify: `app.json:13` — 在 packageA 的 pages 数组中添加新页面

- [ ] **Step 1: 在 app.json 中注册 werun 页面**

在 `app.json` 的 `subPackages[0].pages` 数组末尾（`pages/treeHole/treeHole` 之后）添加：

```json
"pages/werun/werun"
```

修改后的 packageA pages 数组应为：
```json
{
  "root": "packageA",
  "name": "relax",
  "pages": [
    "pages/focus/focus",
    "pages/bubble/index",
    "pages/led/led",
    "pages/decision/decision",
    "pages/decision/edit/edit",
    "pages/emotion-trash/index",
    "pages/coloring/index",
    "pages/treeHole/treeHole",
    "pages/werun/werun"
  ]
}
```

- [ ] **Step 2: 提交路由注册**

```bash
git add app.json
git commit -m "feat(werun): 注册微信运动页面路由"
```

---

### Task 3: 在 toolbox 页面添加入口

**Files:**
- Modify: `pages/toolbox/toolbox.js:49` — 在 tools 数组末尾添加微信运动卡片

- [ ] **Step 1: 在 tools 数组中添加微信运动入口**

在 `pages/toolbox/toolbox.js` 的 `tools` 数组中，在 `时光纪念墙` 对象之后添加：

```javascript
{
  id: 7,
  name: '微信运动',
  icon: 'chart-bar',
  description: '查看31天运动步数',
  url: '/packageA/pages/werun/werun',
  highlight: true
}
```

- [ ] **Step 2: 提交入口代码**

```bash
git add pages/toolbox/toolbox.js
git commit -m "feat(werun): 在放松页添加微信运动入口"
```

---

### Task 4: 创建 werun 页面配置

**Files:**
- Create: `packageA/pages/werun/werun.json`

- [ ] **Step 1: 创建页面配置文件**

创建 `packageA/pages/werun/werun.json`：

```json
{
  "navigationBarTitleText": "微信运动",
  "usingComponents": {
    "t-icon": "tdesign-miniprogram/icon/icon"
  }
}
```

---

### Task 5: 创建 werun 页面模板

**Files:**
- Create: `packageA/pages/werun/werun.wxml`

- [ ] **Step 1: 创建页面模板**

创建 `packageA/pages/werun/werun.wxml`：

```xml
<!--packageA/pages/werun/werun.wxml - 微信运动步数可视化-->
<view class="page">
  <!-- 装饰背景 -->
  <view class="bg-decoration bg-deco-1"></view>
  <view class="bg-decoration bg-deco-2"></view>

  <!-- 授权引导页 -->
  <view class="auth-container" wx:if="{{!isAuthorized}}">
    <view class="auth-card">
      <view class="auth-icon-box">
        <t-icon name="chart-bar" size="80rpx" color="#8EC5B9"></t-icon>
      </view>
      <text class="auth-title">微信运动</text>
      <text class="auth-desc">查看你过去31天的运动步数数据，用图表展示你的运动轨迹</text>
      <button class="auth-btn" bindtap="requestAuth">
        <t-icon name="lock-on" size="32rpx" color="#fff"></t-icon>
        <text>授权查看运动数据</text>
      </button>
      <view class="auth-tip" wx:if="{{authDenied}}">
        <text class="auth-tip-text">你已拒绝授权，请点击下方按钮前往设置页开启</text>
        <button class="setting-btn" open-type="openSetting" bindopensetting="onSettingCallback">
          打开设置
        </button>
      </view>
    </view>
  </view>

  <!-- 主内容 -->
  <view class="main-content" wx:if="{{isAuthorized}}">
    <!-- 加载状态 -->
    <view class="loading-container" wx:if="{{isLoading}}">
      <view class="loading-spinner"></view>
      <text class="loading-text">正在获取运动数据...</text>
    </view>

    <!-- 数据内容 -->
    <view wx:if="{{!isLoading && stepInfoList.length > 0}}">
      <!-- 统计卡片 -->
      <view class="stats-row">
        <view class="stat-card">
          <text class="stat-value">{{totalSteps}}</text>
          <text class="stat-label">总步数</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{avgSteps}}</text>
          <text class="stat-label">日均步数</text>
        </view>
        <view class="stat-card">
          <text class="stat-value">{{maxSteps}}</text>
          <text class="stat-label">最高步数</text>
        </view>
      </view>

      <!-- 图表区域 -->
      <view class="chart-section">
        <view class="chart-header">
          <text class="chart-title">步数趋势</text>
          <view class="chart-tabs">
            <view class="chart-tab {{chartType === 'bar' ? 'tab-active' : ''}}" bindtap="switchChart" data-type="bar">
              <t-icon name="bar-chart" size="28rpx" color="{{chartType === 'bar' ? '#8EC5B9' : '#999'}}"></t-icon>
              <text>柱状图</text>
            </view>
            <view class="chart-tab {{chartType === 'line' ? 'tab-active' : ''}}" bindtap="switchChart" data-type="line">
              <t-icon name="chart-line" size="28rpx" color="{{chartType === 'line' ? '#8EC5B9' : '#999'}}"></t-icon>
              <text>折线图</text>
            </view>
          </view>
        </view>
        <view class="chart-wrapper">
          <scroll-view scroll-x class="chart-scroll" enhanced show-scrollbar="{{false}}">
            <canvas type="2d" id="stepChart" class="step-chart"
              style="width: {{chartWidth}}px; height: {{chartHeight}}px;">
            </canvas>
          </scroll-view>
        </view>
        <!-- Tooltip -->
        <view class="chart-tooltip {{tooltipVisible ? 'tooltip-show' : ''}}" style="left: {{tooltipX}}rpx; top: {{tooltipY}}rpx;">
          <text class="tooltip-date">{{tooltipDate}}</text>
          <text class="tooltip-step">{{tooltipStep}} 步</text>
        </view>
      </view>

      <!-- 每日步数列表 -->
      <view class="list-section">
        <text class="list-title">每日步数明细</text>
        <view class="step-list">
          <view class="step-item {{index === 0 ? 'step-today' : ''}}" wx:for="{{stepInfoList}}" wx:key="timestamp">
            <view class="step-item-left">
              <text class="step-item-date">{{item.dateStr}}</text>
              <text class="step-item-week">{{item.weekStr}}</text>
            </view>
            <view class="step-item-bar-box">
              <view class="step-item-bar" style="width: {{item.barPercent}}%;"></view>
            </view>
            <text class="step-item-count">{{item.stepStr}}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view class="empty-container" wx:if="{{!isLoading && stepInfoList.length === 0}}">
      <t-icon name="chart-bar" size="120rpx" color="#ccc"></t-icon>
      <text class="empty-title">暂无运动数据</text>
      <text class="empty-desc">请确保已在微信中开启微信运动功能</text>
    </view>

    <!-- 错误状态 -->
    <view class="error-container" wx:if="{{errorMsg}}">
      <t-icon name="close-circle" size="120rpx" color="#FF6B81"></t-icon>
      <text class="error-title">{{errorMsg}}</text>
      <button class="retry-btn" bindtap="loadWeRunData">重新获取</button>
    </view>
  </view>
</view>
```

---

### Task 6: 创建 werun 页面样式

**Files:**
- Create: `packageA/pages/werun/werun.wxss`

- [ ] **Step 1: 创建页面样式**

创建 `packageA/pages/werun/werun.wxss`：

```css
/* packageA/pages/werun/werun.wxss */
@import '../../styles/theme.wxss';

.page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f5f7f8 0%, #e8f5f3 100%);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

/* ===== 装饰背景 ===== */
.bg-decoration {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
}

.bg-deco-1 {
  top: -100rpx;
  right: -80rpx;
  width: 300rpx;
  height: 300rpx;
  background: radial-gradient(circle, rgba(142, 197, 185, 0.12) 0%, transparent 70%);
  animation: float 8s ease-in-out infinite;
}

.bg-deco-2 {
  bottom: 20%;
  left: -100rpx;
  width: 260rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(255, 181, 169, 0.1) 0%, transparent 70%);
  animation: float 10s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(20rpx, -20rpx) scale(1.05); }
  66% { transform: translate(-15rpx, 15rpx) scale(0.95); }
}

/* ===== 授权引导页 ===== */
.auth-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48rpx 40rpx;
  position: relative;
  z-index: 1;
}

.auth-card {
  background: var(--surface-white);
  border-radius: var(--radius-2xl);
  padding: 64rpx 48rpx;
  box-shadow: var(--shadow-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  border: 1px solid rgba(142, 197, 185, 0.1);
}

.auth-icon-box {
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(135deg, rgba(142, 197, 185, 0.15) 0%, rgba(111, 169, 154, 0.08) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.auth-title {
  font-size: 40rpx;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 16rpx;
}

.auth-desc {
  font-size: 28rpx;
  color: var(--text-tertiary);
  text-align: center;
  line-height: 1.6;
  margin-bottom: 48rpx;
}

.auth-btn {
  display: inline-flex;
  align-items: center;
  gap: 12rpx;
  padding: 28rpx 64rpx;
  border-radius: var(--radius-full);
  font-size: 30rpx;
  font-weight: 600;
  background: linear-gradient(135deg, var(--primary-start) 0%, var(--primary-end) 100%);
  color: #fff;
  box-shadow: var(--shadow-primary);
  border: none;
}

.auth-btn::after {
  border: none;
}

.auth-btn:active {
  transform: scale(0.96);
}

.auth-tip {
  margin-top: 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.auth-tip-text {
  font-size: 26rpx;
  color: var(--text-tertiary);
}

.setting-btn {
  font-size: 28rpx;
  color: var(--primary-start);
  background: transparent;
  border: 1px solid var(--primary-start);
  border-radius: var(--radius-full);
  padding: 16rpx 48rpx;
}

.setting-btn::after {
  border: none;
}

/* ===== 主内容区 ===== */
.main-content {
  flex: 1;
  position: relative;
  z-index: 1;
}

/* ===== 加载状态 ===== */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid rgba(142, 197, 185, 0.2);
  border-top-color: var(--primary-start);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 24rpx;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 28rpx;
  color: var(--text-tertiary);
}

/* ===== 统计卡片 ===== */
.stats-row {
  display: flex;
  gap: 20rpx;
  padding: 32rpx 32rpx 16rpx;
}

.stat-card {
  flex: 1;
  background: var(--surface-white);
  border-radius: var(--radius-xl);
  padding: 28rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(142, 197, 185, 0.08);
}

.stat-value {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--primary-start);
}

.stat-label {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

/* ===== 图表区域 ===== */
.chart-section {
  margin: 16rpx 32rpx;
  background: var(--surface-white);
  border-radius: var(--radius-2xl);
  padding: 32rpx;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(142, 197, 185, 0.08);
}

.chart-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.chart-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
}

.chart-tabs {
  display: flex;
  gap: 8rpx;
  background: #f5f7f8;
  border-radius: var(--radius-full);
  padding: 4rpx;
}

.chart-tab {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 10rpx 24rpx;
  border-radius: var(--radius-full);
  font-size: 24rpx;
  color: var(--text-tertiary);
  transition: all var(--transition-base);
}

.tab-active {
  background: var(--surface-white);
  color: var(--primary-start);
  box-shadow: var(--shadow-xs);
}

.chart-wrapper {
  position: relative;
  width: 100%;
}

.chart-scroll {
  width: 100%;
  white-space: nowrap;
}

.step-chart {
  display: block;
}

/* Tooltip */
.chart-tooltip {
  position: fixed;
  background: rgba(26, 26, 26, 0.85);
  color: #fff;
  padding: 12rpx 24rpx;
  border-radius: var(--radius-md);
  font-size: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  opacity: 0;
  transition: opacity 0.2s;
  pointer-events: none;
  z-index: 100;
}

.tooltip-show {
  opacity: 1;
}

.tooltip-date {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
}

.tooltip-step {
  font-size: 28rpx;
  font-weight: 600;
}

/* ===== 每日步数列表 ===== */
.list-section {
  margin: 16rpx 32rpx 0;
}

.list-title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16rpx;
  display: block;
  padding-left: 8rpx;
}

.step-list {
  background: var(--surface-white);
  border-radius: var(--radius-2xl);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  border: 1px solid rgba(142, 197, 185, 0.08);
}

.step-item {
  display: flex;
  align-items: center;
  padding: 24rpx 28rpx;
  gap: 20rpx;
  border-bottom: 1px solid #f5f5f5;
}

.step-item:last-child {
  border-bottom: none;
}

.step-today {
  background: rgba(142, 197, 185, 0.05);
}

.step-item-left {
  width: 120rpx;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.step-item-date {
  font-size: 28rpx;
  color: var(--text-primary);
  font-weight: 500;
}

.step-item-week {
  font-size: 22rpx;
  color: var(--text-tertiary);
}

.step-item-bar-box {
  flex: 1;
  height: 16rpx;
  background: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}

.step-item-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-start) 0%, var(--primary-end) 100%);
  border-radius: 8rpx;
  min-width: 4rpx;
  transition: width 0.3s ease;
}

.step-item-count {
  font-size: 28rpx;
  color: var(--text-primary);
  font-weight: 600;
  min-width: 100rpx;
  text-align: right;
}

.step-today .step-item-count {
  color: var(--primary-start);
}

/* ===== 空状态 ===== */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  gap: 16rpx;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--text-secondary);
  margin-top: 16rpx;
}

.empty-desc {
  font-size: 26rpx;
  color: var(--text-tertiary);
}

/* ===== 错误状态 ===== */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
  gap: 16rpx;
}

.error-title {
  font-size: 28rpx;
  color: var(--text-secondary);
  margin-top: 16rpx;
  text-align: center;
}

.retry-btn {
  margin-top: 24rpx;
  font-size: 28rpx;
  color: var(--primary-start);
  background: transparent;
  border: 1px solid var(--primary-start);
  border-radius: var(--radius-full);
  padding: 16rpx 48rpx;
}

.retry-btn::after {
  border: none;
}
```

---

### Task 7: 创建 werun 页面逻辑

**Files:**
- Create: `packageA/pages/werun/werun.js`

这是核心任务，包含授权流程、数据获取、Canvas 图表绘制。

- [ ] **Step 1: 创建页面 JS 文件**

创建 `packageA/pages/werun/werun.js`：

```javascript
// packageA/pages/werun/werun.js - 微信运动步数可视化
const { cloud } = require('../../utils/cloud')

const app = getApp()
const systemInfo = wx.getWindowInfo()
const DPR = systemInfo.pixelRatio
const CHART_HEIGHT_PX = 200

Page({
  data: {
    // 授权状态
    isAuthorized: false,
    authDenied: false,

    // 数据状态
    isLoading: false,
    stepInfoList: [],
    errorMsg: '',

    // 统计数据
    totalSteps: '0',
    avgSteps: '0',
    maxSteps: '0',

    // 图表
    chartType: 'bar',
    chartWidth: 0,
    chartHeight: 0,

    // Tooltip
    tooltipVisible: false,
    tooltipX: 0,
    tooltipY: 0,
    tooltipDate: '',
    tooltipStep: ''
  },

  // Canvas 相关
  canvas: null,
  ctx: null,
  chartData: [],

  onLoad() {
    this.checkAuth()
  },

  // ===== 授权流程 =====

  checkAuth() {
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.werun']) {
          this.setData({ isAuthorized: true })
          this.loadWeRunData()
        } else {
          this.setData({ isAuthorized: false })
        }
      }
    })
  },

  requestAuth() {
    wx.authorize({
      scope: 'scope.werun',
      success: () => {
        this.setData({ isAuthorized: true, authDenied: false })
        this.loadWeRunData()
      },
      fail: () => {
        this.setData({ authDenied: true })
        wx.showToast({ title: '需要授权才能查看运动数据', icon: 'none' })
      }
    })
  },

  onSettingCallback(res) {
    if (res.detail.authSetting['scope.werun']) {
      this.setData({ isAuthorized: true, authDenied: false })
      this.loadWeRunData()
    }
  },

  // ===== 数据获取 =====

  async loadWeRunData() {
    this.setData({ isLoading: true, errorMsg: '' })

    try {
      // 1. 调用 wx.getWeRunData 获取 cloudID
      const werunRes = await new Promise((resolve, reject) => {
        wx.getWeRunData({
          success: resolve,
          fail: reject
        })
      })

      // 2. 通过云函数解密数据
      const result = await cloud.callFunction('getWeRunData', {
        cloudID: werunRes.cloudID
      })

      if (!result.success) {
        throw new Error(result.message || '获取数据失败')
      }

      const stepInfoList = result.stepInfoList || []

      // 3. 处理数据
      this.processStepData(stepInfoList)

    } catch (err) {
      console.error('获取微信运动数据失败:', err)
      let msg = '获取运动数据失败'
      if (err.errMsg && err.errMsg.indexOf('auth deny') > -1) {
        msg = '请授权后查看运动数据'
      } else if (err.errMsg && err.errMsg.indexOf('not support') > -1) {
        msg = '当前设备不支持微信运动'
      }
      this.setData({ isLoading: false, errorMsg: msg })
    }
  },

  processStepData(rawList) {
    // 按时间升序排列
    rawList.sort((a, b) => a.timestamp - b.timestamp)

    const maxStep = Math.max(...rawList.map(item => item.step), 1)
    const totalStep = rawList.reduce((sum, item) => sum + item.step, 0)
    const avgStep = Math.round(totalStep / rawList.length)

    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    const stepInfoList = rawList.map(item => {
      const date = new Date(item.timestamp * 1000)
      const month = date.getMonth() + 1
      const day = date.getDate()
      const weekDay = weekDays[date.getDay()]
      const barPercent = Math.round((item.step / maxStep) * 100)

      return {
        timestamp: item.timestamp,
        step: item.step,
        dateStr: `${month}/${day}`,
        weekStr: weekDay,
        fullDate: `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        stepStr: item.step.toLocaleString(),
        barPercent
      }
    })

    this.chartData = stepInfoList

    this.setData({
      isLoading: false,
      stepInfoList,
      totalSteps: totalStep.toLocaleString(),
      avgSteps: avgStep.toLocaleString(),
      maxSteps: maxStep.toLocaleString()
    })

    // 初始化 Canvas 并绘制图表
    this.initCanvas()
  },

  // ===== Canvas 图表 =====

  initCanvas() {
    const query = this.createSelectorQuery()
    query.select('#stepChart')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        const dataCount = this.chartData.length
        // 每个数据点至少 24px 宽度，保证可读性
        const minWidthPx = Math.max(dataCount * 24, systemInfo.windowWidth - 64)
        const widthPx = minWidthPx

        const dpr = wx.getWindowInfo().pixelRatio
        canvas.width = widthPx * dpr
        canvas.height = CHART_HEIGHT_PX * dpr
        ctx.scale(dpr, dpr)

        this.canvas = canvas
        this.ctx = ctx

        this.setData({
          chartWidth: widthPx,
          chartHeight: CHART_HEIGHT_PX
        })

        this.drawChart()
      })
  },

  drawChart() {
    const ctx = this.ctx
    if (!ctx || !this.chartData.length) return

    const data = this.chartData
    const width = this.data.chartWidth
    const height = CHART_HEIGHT_PX

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    if (this.data.chartType === 'bar') {
      this.drawBarChart(ctx, data, width, height)
    } else {
      this.drawLineChart(ctx, data, width, height)
    }
  },

  drawBarChart(ctx, data, width, height) {
    const padding = { top: 20, right: 16, bottom: 36, left: 16 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const barWidth = Math.min(chartW / data.length * 0.6, 20)
    const gap = chartW / data.length
    const maxVal = Math.max(...data.map(d => d.step), 1)

    // 绘制 Y 轴参考线
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // 绘制柱子
    data.forEach((item, index) => {
      const x = padding.left + gap * index + (gap - barWidth) / 2
      const barH = (item.step / maxVal) * chartH
      const y = padding.top + chartH - barH

      // 渐变填充
      const gradient = ctx.createLinearGradient(x, y, x, padding.top + chartH)
      gradient.addColorStop(0, '#8EC5B9')
      gradient.addColorStop(1, 'rgba(142, 197, 185, 0.3)')

      ctx.fillStyle = gradient
      // 圆角柱子
      const radius = Math.min(barWidth / 2, 4)
      this.roundRect(ctx, x, y, barWidth, barH, radius)
      ctx.fill()

      // X 轴日期（隔几个显示）
      if (index % Math.ceil(data.length / 8) === 0 || index === data.length - 1) {
        ctx.fillStyle = '#999'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(item.dateStr, x + barWidth / 2, height - 8)
      }
    })
  },

  drawLineChart(ctx, data, width, height) {
    const padding = { top: 20, right: 16, bottom: 36, left: 16 }
    const chartW = width - padding.left - padding.right
    const chartH = height - padding.top - padding.bottom
    const gap = chartW / (data.length - 1 || 1)
    const maxVal = Math.max(...data.map(d => d.step), 1)

    const points = data.map((item, index) => ({
      x: padding.left + gap * index,
      y: padding.top + chartH - (item.step / maxVal) * chartH
    }))

    // 绘制 Y 轴参考线
    ctx.strokeStyle = '#f0f0f0'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(width - padding.right, y)
      ctx.stroke()
    }

    // 填充区域渐变
    ctx.beginPath()
    ctx.moveTo(points[0].x, padding.top + chartH)
    points.forEach(p => ctx.lineTo(p.x, p.y))
    ctx.lineTo(points[points.length - 1].x, padding.top + chartH)
    ctx.closePath()

    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH)
    gradient.addColorStop(0, 'rgba(142, 197, 185, 0.3)')
    gradient.addColorStop(1, 'rgba(142, 197, 185, 0.02)')
    ctx.fillStyle = gradient
    ctx.fill()

    // 绘制折线
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.strokeStyle = '#8EC5B9'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    // 绘制数据点
    points.forEach((p, i) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#fff'
      ctx.fill()
      ctx.strokeStyle = '#8EC5B9'
      ctx.lineWidth = 1.5
      ctx.stroke()
    })

    // X 轴日期
    data.forEach((item, index) => {
      if (index % Math.ceil(data.length / 8) === 0 || index === data.length - 1) {
        ctx.fillStyle = '#999'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        const x = padding.left + gap * index
        ctx.fillText(item.dateStr, x, height - 8)
      }
    })
  },

  roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2)
    if (h < 1) { h = 1; y = y + h - 1; }
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h)
    ctx.lineTo(x, y + h)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  },

  // ===== 交互 =====

  switchChart(e) {
    const type = e.currentTarget.dataset.type
    if (type === this.data.chartType) return

    this.setData({ chartType: type })
    this.drawChart()
  },

  onCanvasTouch(e) {
    if (!this.chartData.length) return

    const touch = e.touches[0]
    const data = this.chartData
    const width = this.data.chartWidth
    const height = CHART_HEIGHT_PX
    const padding = { top: 20, right: 16, bottom: 36, left: 16 }
    const chartW = width - padding.left - padding.right

    const gap = this.data.chartType === 'bar'
      ? chartW / data.length
      : chartW / (data.length - 1 || 1)

    const offsetX = touch.x
    let index

    if (this.data.chartType === 'bar') {
      index = Math.floor((offsetX - padding.left) / gap)
    } else {
      index = Math.round((offsetX - padding.left) / gap)
    }

    if (index < 0 || index >= data.length) {
      this.setData({ tooltipVisible: false })
      return
    }

    const item = data[index]
    this.setData({
      tooltipVisible: true,
      tooltipDate: item.fullDate,
      tooltipStep: item.step.toLocaleString()
    })
  }
})
```

- [ ] **Step 2: 提交页面代码**

```bash
git add packageA/pages/werun/
git commit -m "feat(werun): 创建微信运动步数可视化页面"
```

> **验证：** 在微信开发者工具中编译，从放松页点击"微信运动"入口，确认：
> 1. 授权引导页正常展示
> 2. 授权后数据加载并显示统计卡片
> 3. 柱状图/折线图切换正常
> 4. 每日步数列表正常显示

---

### Task 8: 最终集成验证

- [ ] **Step 1: 在微信开发者工具中验证完整流程**

验证清单：
1. 放松页能看到"微信运动"卡片，带高亮样式
2. 点击进入后展示授权引导页
3. 授权后展示统计数据（总步数、日均、最高）
4. 柱状图和折线图能正常切换
5. 每日步数列表正常显示，今日有高亮
6. 空状态和错误状态正常展示

- [ ] **Step 2: 部署云函数**

在微信开发者工具中：
1. 右键 `cloudfunctions/getWeRunData` → 上传并部署：云端安装依赖
2. 等待部署完成
3. 确认云函数调用成功

- [ ] **Step 3: 最终提交**

如有调整：
```bash
git add -A
git commit -m "feat(werun): 微信运动步数可视化功能完成"
```
