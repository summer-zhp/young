// cloudfunctions/getAppConfig/index.js
// 获取应用配置 - 用于控制功能显示和隐藏

/**
 * 获取应用环境配置
 * @returns {Object} 配置信息
 */
exports.main = async (event, context) => {
    try {
        // 从环境变量读取配置
        // 默认值：如果环境变量未设置，默认为开启 (true)
        const treeHoleEnabled = process.env.TREE_HOLE_ENABLED !== 'false'
        const captionImageEnabled = process.env.CAPTION_IMAGE_ENABLED !== 'false'

        return {
            success: true,
            config: {
                // 树洞功能是否开启
                treeHoleEnabled,
                // 朋友圈文案配图功能是否开启
                captionImageEnabled
            }
        }
    } catch (error) {
        console.error('获取配置失败:', error)
        return {
            success: false,
            code: 'config_error',
            message: error.message
        }
    }
}
