# 微信运动步数可视化功能设计

## 概述

在工具箱（放松页）添加"微信运动"入口，用户点击后查看过去31天的微信运动步数数据，以柱状图+折线图可视化展示，并提供统计摘要和每日明细列表。

## 技术方案

**Canvas 自绘图表**：使用小程序原生 Canvas 2D API 绘制柱状图和折线图，不引入第三方图表库，零包体积增加，样式完全匹配项目设计系统。

## 新增文件

| 文件 | 说明 |
|------|------|
| `packageA/pages/werun/werun.js` | 页面逻辑 |
| `packageA/pages/werun/werun.wxml` | 页面模板 |
| `packageA/pages/werun/werun.wxss` | 页面样式 |
| `packageA/pages/werun/werun.json` | 页面配置 |
| `cloudfunctions/getWeRunData/index.js` | 云函数：用 cloudID 解密步数 |
| `cloudfunctions/getWeRunData/package.json` | 云函数依赖 |

## 修改文件

| 文件 | 说明 |
|------|------|
| `pages/toolbox/toolbox.js` | 添加"微信运动"工具卡片 |
| `app.json` | 注册 `packageA/pages/werun/werun` |

## 数据流

```
用户点击"微信运动"卡片
  → navigateTo werun 页面
    → 检查 scope.werun 授权 (wx.getSetting)
      → 未授权：展示引导界面，引导授权
      → 已授权：
        → wx.login() + wx.getWeRunData()
          → 获得 cloudID
            → 调用云函数 getWeRunData 解密
              → 返回 stepInfoList [{timestamp, step}]
                → Canvas 绘制图表 + 渲染统计数据
```

## 页面结构

```
┌─────────────────────────┐
│      微信运动             │  导航栏标题
├─────────────────────────┤
│  ┌───┐ ┌───┐ ┌───┐      │
│  │总步│ │日均│ │最高│      │  统计卡片（三列）
│  │数  │ │步数│ │步数│      │
│  └───┘ └───┘ └───┘      │
├─────────────────────────┤
│  [柱状图] [折线图]         │  图表类型切换
│  ┌─────────────────────┐ │
│  │   Canvas 图表区域     │ │  横向滚动查看31天
│  └─────────────────────┘ │
├─────────────────────────┤
│  今日  12,345 步          │  每日步数列表
│  昨天  8,234 步           │
│  ...                     │
└─────────────────────────┘
```

## 云函数设计

### getWeRunData

- **输入**：`{ cloudID: string }`
- **逻辑**：通过 `event.cloudID` 直接获取开放数据（云开发自动解密）
- **输出**：`{ stepInfoList: [{ timestamp: number, step: number }] }`
- 使用 `wx-server-sdk`，初始化 `cloud.DYNAMIC_CURRENT_ENV`

## 授权处理

1. 进入页面先调用 `wx.getSetting` 检查 `scope.werun`
2. 未授权时展示引导界面，说明用途
3. 点击按钮调用 `wx.authorize({ scope: 'scope.werun' })`
4. 用户拒绝后提供"打开设置页"入口（`wx.openSetting`）

## 图表设计

### 柱状图
- 每根柱子代表一天的步数
- 柱子颜色使用项目主色 `--primary-start: #8EC5B9` 渐变
- X 轴显示日期（天），Y 轴显示步数
- 点击柱子显示具体步数

### 折线图
- 同样的数据，用曲线连接
- 线下方填充半透明主色渐变区域
- 数据点可点击查看详情

### 交互
- 顶部切换按钮在柱状图和折线图之间切换
- Canvas 区域支持横向滚动查看完整31天数据
- 点击数据点/柱子弹出 tooltip 显示日期和步数

## 工具箱入口

在 `pages/toolbox/toolbox.js` 的 `tools` 数组中添加：

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

## 样式规范

- 遵循项目设计系统 `styles/theme.wxss`
- 使用 CSS 变量：`--primary-start`、`--text-primary`、`--radius-xl` 等
- 背景渐变与 toolbox 页面一致
- 统计卡片使用白色背景 + 圆角 + 轻阴影

## 错误处理

- `wx.getWeRunData` 调用失败：提示"获取运动数据失败，请确保已开启微信运动"
- 云函数调用失败：提示"网络异常，请稍后重试"
- 授权被拒绝：保留"去设置"入口
- 无步数数据：展示空状态插画 + 提示文案
