# 灵魂画像 - 功能设计文档

**日期**: 2026-04-28
**状态**: 已确认
**入口页面**: `pages/toolbox/toolbox`

## 概述

"灵魂画像"是一个趣味人格测试功能，用户通过回答 40 道 MBTI 风格的题目，获得包含动物人格、职场人设、奇幻角色三重趣味包装的测试结果。支持无限重测、历史记录查看和分享海报生成。

## 架构方案

混合式架构：题目数据前端硬编码保证加载速度，评分和结果映射在云函数中完成便于调参。

## 页面结构

### 页面清单

| 页面 | 路径 | 职责 |
|------|------|------|
| 答题页 | `packageA/soul-quiz/quiz` | 逐题答题，顶部进度条，单题卡片交互 |
| 结果页 | `packageA/soul-quiz/result` | MBTI 雷达图 + 三重趣味标签 + 性格分析 + 分享 |
| 历史记录页 | `packageA/soul-quiz/history` | 所有历史测试记录列表，点击可查看详情 |

### 用户流程

1. 工具箱页面点击"灵魂画像"卡片 → 进入答题页
2. 逐题答题（40题），点击选项自动滑到下一题，顶部显示进度
3. 答完最后一题 → 调用 `scoreSoulQuiz` 云函数评分 → 跳转结果页
4. 结果页展示完整画像，可生成分享图保存到相册
5. 结果存入云数据库 `soul_quiz_records`，历史页可查看所有记录

## 题目数据结构

### 维度分组（40题，每维度10题）

- **E/I 维度**（10题）：外向 vs 内向
- **S/N 维度**（10题）：感觉 vs 直觉
- **T/F 维度**（10题）：思维 vs 情感
- **J/P 维度**（10题）：判断 vs 知觉

### 单题结构

```javascript
{
  id: 1,
  dimension: 'EI',
  text: '周末到了，你更倾向于？',
  options: [
    { text: '约朋友出去聚会逛街', value: 'E', score: 1 },
    { text: '在家安静地看书追剧', value: 'I', score: 1 }
  ]
}
```

### 答案传递格式

用户答案以索引数组提交给云函数：

```javascript
answers: [0, 1, 0, 1, 0, 1, 0, 1, ...]  // 40个元素，值为 0 或 1
```

## 评分逻辑

### 云函数 `scoreSoulQuiz`

**输入**: `{ answers: number[] }` （40个选项索引）

**处理流程**:
1. 逐题查映射表，累计 E/I/S/N/T/F/J/P 各端得分
2. 判断每个维度倾向：如 E:7, I:3 → 结果 E，倾向度 70%
3. 四维度组合得到 MBTI 16种类型之一（如 ENFP）
4. 查结果映射表得到：动物人格 + 职场人设 + 奇幻角色 + 性格分析文本
5. 将完整记录写入 `soul_quiz_records` 集合
6. 返回结果

**输出**:
```javascript
{
  success: true,
  data: {
    mbti_type: 'ENFP',
    scores: { EI: 70, SN: 60, TF: 55, JP: 65 },  // 各维度倾向百分比（正值代表前一端）
    animal: { name: '金毛犬', icon: 'iconfont-class' },
    workplace: { name: '社交发动机', description: '...' },
    fantasy: { name: '灵焰使者', description: '...' },
    analysis: '你是一个充满热情和创造力的灵魂...',
    keywords: ['热情', '创造力', '社交达人', '乐观主义']
  }
}
```

### MBTI 类型到趣味标签映射

16种 MBTI 类型各映射一组标签：

| MBTI | 动物人格 | 职场人设 | 奇幻角色 |
|------|---------|---------|---------|
| ENFP | 金毛犬 | 社交发动机 | 灵焰使者 |
| INTJ | 猫头鹰 | 战略大师 | 暗影贤者 |
| ISTP | 猎鹰 | 极客独行侠 | 风暴锻造师 |
| ... | ... | ... | ... |

（完整16组映射表在实现时编写）

## 云函数设计

### scoreSoulQuiz

- **路径**: `cloudfunctions/scoreSoulQuiz/index.js`
- **依赖**: `wx-server-sdk`
- **职责**: 评分计算 + 结果映射 + 数据存储
- **安全**: 验证 OPENID，答案数组长度校验（必须为40）

### getSoulQuizHistory

- **路径**: `cloudfunctions/getSoulQuizHistory/index.js`
- **依赖**: `wx-server-sdk`
- **职责**: 查询当前用户所有测试记录，按 `created_at` 倒序，支持分页（每次20条）
- **返回**: 记录数组，每条包含 `mbti_type`、`animal`、`workplace`、`fantasy`、`created_at`

## 数据库集合

### soul_quiz_records

```javascript
{
  _openid: 'xxx',                    // 微信用户ID
  mbti_type: 'ENFP',                 // MBTI 类型
  scores: {                           // 四维倾向百分比
    EI: 70,   // 正值=E倾向，负值=I倾向
    SN: 60,   // 正值=S倾向，负值=N倾向
    TF: 55,   // 正值=T倾向，负值=F倾向
    JP: 65    // 正值=J倾向，负值=P倾向
  },
  animal: '金毛犬',                   // 动物人格名称
  workplace: '社交发动机',             // 职场人设名称
  fantasy: '灵焰使者',                // 奇幻角色名称
  analysis: '...',                    // 性格详细分析文本
  keywords: ['热情', '创造力'],        // 性格关键词
  answers: [0, 1, 0, ...],           // 用户原始答案（40个）
  created_at: Date                    // 创建时间
}
```

## UI 设计

### 答题页

- 顶部：进度条（"第 X / 40 题" + 百分比）
- 维度标签：显示当前题目所属维度
- 题目文本：居中显示
- 选项：圆角卡片，左侧 A/B 圆形标签与文字水平居中对齐，点击后自动进入下一题
- 底部：轻提示"点击选项自动进入下一题"

### 结果页

- MBTI 类型：大字体渐变色显示
- 四维雷达图：展示各维度得分
- 三重趣味标签卡片：动物人格 + 职场人设 + 奇幻角色，各带渐变背景色
- 性格解读：分析文本
- 底部按钮：「生成分享图」「查看历史」

### 分享海报

深色星空风格卡片，Canvas 绘制：
- 顶部渐变装饰线
- 星座装饰符
- "我的灵魂画像"标题
- 动物头像（iconfont 图标）
- MBTI 类型 + 三重标签
- 性格关键词标签
- 性格摘要
- 底部品牌标识"打工人治愈所 · 灵魂画像测试"

### 历史记录页

- 卡片列表，每张卡片包含：动物头像、MBTI 类型 + 动物名、职场人设 + 奇幻角色、测试日期
- 点击卡片可查看该次完整结果

## 工具箱入口

在 `pages/toolbox/toolbox` 页面新增卡片：
- 图标：心理学相关图标
- 名称：灵魂画像
- 描述：探索你的灵魂动物与人格密码
- NEW 标签
- 跳转：`wx.navigateTo({ url: '/packageA/soul-quiz/quiz' })`

## 重测规则

- 用户可无限次重测
- 每次测试生成独立记录
- 历史记录页可查看所有历史结果

## 文件清单

### 前端页面（packageA/soul-quiz/）

```
packageA/soul-quiz/
├── quiz.js          # 答题页逻辑
├── quiz.json        # 答题页配置
├── quiz.wxml        # 答题页模板
├── quiz.wxss        # 答题页样式
├── result.js        # 结果页逻辑
├── result.json      # 结果页配置
├── result.wxml      # 结果页模板
├── result.wxss      # 结果页样式
├── history.js       # 历史记录页逻辑
├── history.json     # 历史记录页配置
├── history.wxml     # 历史记录页模板
└── history.wxss     # 历史记录页样式
```

### 题目数据

```
utils/soulQuizData.js   # 40道题目数据 + MBTI到趣味标签的映射表
```

### 云函数

```
cloudfunctions/
├── scoreSoulQuiz/
│   ├── index.js       # 评分 + 结果映射 + 存储
│   └── package.json
└── getSoulQuizHistory/
    ├── index.js       # 查询历史记录
    └── package.json
```

### 修改的文件

```
app.json               # 注册新页面路径
pages/toolbox/toolbox.wxml   # 添加入口卡片
pages/toolbox/toolbox.js     # 添加跳转逻辑
```
