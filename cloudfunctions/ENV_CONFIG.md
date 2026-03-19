# 云函数环境变量配置说明

## 概述

本项目使用云函数环境变量来控制功能的显示和隐藏，目前支持以下两个功能：

| 环境变量名 | 功能 | 默认值 | 说明 |
|-----------|------|--------|------|
| `TREE_HOLE_ENABLED` | 树洞功能 | `true` | 控制工具箱中的树洞入口是否显示 |
| `CAPTION_IMAGE_ENABLED` | 朋友圈文案配图功能 | `true` | 控制工具箱中的朋友圈配图入口是否显示 |

## 设置方法

### 方式一：微信云开发控制台（推荐）

1. 登录 [微信云开发控制台](https://console.cloud.weixin.qq.com/)
2. 进入你的环境：`cloud1-2gpreb4e2dc05acb`
3. 找到 **云函数** -> **getAppConfig**
4. 点击 **配置** -> **环境变量**
5. 添加以下环境变量：

```
TREE_HOLE_ENABLED=false
CAPTION_IMAGE_ENABLED=false
```

6. 点击保存并重新部署云函数

### 方式二：使用云开发 CLI

```bash
# 安装云开发 CLI
npm install -g @cloudbase/cli

# 登录
tcb login

# 设置环境变量
tcb fn env update --name getAppConfig --env-vars TREE_HOLE_ENABLED=false
tcb fn env update --name getAppConfig --env-vars CAPTION_IMAGE_ENABLED=false
```

## 配置效果

| TREE_HOLE_ENABLED | CAPTION_IMAGE_ENABLED | 效果 |
|-------------------|----------------------|------|
| `true` 或未设置 | `true` 或未设置 | 两个功能都显示 |
| `false` | `true` 或未设置 | 隐藏树洞，显示朋友圈配图 |
| `true` 或未设置 | `false` | 显示树洞，隐藏朋友圈配图 |
| `false` | `false` | 两个功能都隐藏 |

## 注意事项

1. 环境变量修改后需要重新部署云函数才能生效
2. 小程序端会在启动时自动获取最新配置
3. 如果获取配置失败，默认两个功能都开启
4. 配置实时生效，修改后用户下次打开小程序即生效

## 相关文件

- 云函数：`cloudfunctions/getAppConfig/index.js` - 读取环境变量并返回配置
- 小程序入口：`app.js` - 启动时获取配置并存储到 globalData
- 树洞入口控制：`pages/toolbox/toolbox.js` - 根据 `treeHoleEnabled` 过滤工具列表
- 朋友圈配图入口控制：`pages/toolkit/toolkit.js` - 根据 `captionImageEnabled` 控制显示

## 新增功能控制

如果需要添加新的功能控制，需要：

1. 在 `cloudfunctions/getAppConfig/index.js` 中添加新的环境变量读取
2. 在 `app.js` 的 globalData 中添加新的配置项
3. 在对应的页面 JS 中读取配置并控制显示
