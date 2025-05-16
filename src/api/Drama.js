import request from '@/utils/request.js'
import { processVideoSourceId} from '@/utils/rc4Utils'

/**
 * 获取番剧列表
 * @param {Object} params 请求参数
 * @returns {Promise} 请求Promise
 */
export const getDramaListService = (params = {}) => {
    // 设置默认参数
    const defaultParams = {
        typeId: 1,
        page: 1,
        limit: 18,
        type: 'updateTime' // 默认按更新时间排序
    }

    // 合并默认参数和传入参数
    const finalParams = {...defaultParams, ...params}

    return request.get('/sk-api/vod/list', {
        params: finalParams
    })
}

/**
 * 获取番剧详情
 */
export const getDramaDetailService = (vodId) => {
    return request.get('/sk-api/vod/one?vodId=' + vodId)
}

/**
 * 获取视频地址
 * @param {string} sourceId 加密的视频源ID
 * @returns {Promise} 请求Promise
 */
export const getVideoUrlService = (sourceId) =>   {
    // 检查参数
    if (!sourceId) {
        return Promise.reject(new Error('无效的视频源ID'))
    }

    // 使用工具函数处理视频链接，去除前缀
    const processedUrl = processVideoSourceId(sourceId)

    // 固定的随机MD5值，此处使用示例值，也可通过参数传入
    const randomMD5 = 'd67e91813b07e8304ee0c974bc97238e'
    
    // 拼接随机MD5值
    const finalUrl = `${processedUrl}RANDOM${randomMD5}`
    console.log('最终请求URL:', finalUrl)
    
    // 调用后端接口获取视频地址
    return request({
        url: '/sk-api/vod/skjson',
        method: 'get',
        params: {
            url: finalUrl // 传递拼接了随机MD5值的URL
        }
    })
}

/**
 * 相关推荐
 */
export const getRelatedDramaService = (typeId, params = {}) => {

    // 确保typeId是有效值
    const finalTypeId = typeId || 1

    // 设置默认参数
    const defaultParams = {
        typeId: finalTypeId,
        page: 1,
        limit: 10,
        type: 'randomlike'
    }

    // 合并默认参数和传入参数
    const finalParams = {...defaultParams, ...params}

    return request({
        url: '/sk-api/vod/list',
        method: 'get',
        params: finalParams
    })
}
