import request from '@/utils/request.js'
import {decryptHexString} from '@/utils/aesUtils'
import {parseVideoId, parseRC4D} from '@/utils/rc4Utils'

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
        type: 'updateTime'
    }

    // 合并默认参数和传入参数
    const finalParams = {...defaultParams, ...params}

    return request.get('/vod/list', {
        params: finalParams
    })
}

/**
 * 获取番剧详情
 */
export const getDramaDetailService = (vodId) => {
    return request.get('/vod/one?vodId=' + vodId)
}

/**
 * 获取视频地址
 * @param {string} vodId 视频ID
 * @param {string} sourceId 加密的视频源ID
 * @returns {Promise} 请求Promise
 */
export const getVideoUrlService = (vodId, sourceId) => {
    // 检查参数
    if (!sourceId) {
        return Promise.reject(new Error('无效的视频源ID'))
    }

    // 处理视频链接，去除“第X集$”前缀
    let processedUrl = sourceId

    // 检查是否有“第X集$”格式的前缀
    const episodePrefixMatch = processedUrl.match(/^第\d+集\$/)
    if (episodePrefixMatch) {
        const prefix = episodePrefixMatch[0]
        processedUrl = processedUrl.substring(prefix.length)
        console.log('去除前缀后:', processedUrl)
    }
    // 调用后端接口获取视频地址
    return request({
        url: '/vod/skjson',
        method: 'get',
        params: {
            vodId,
            url: processedUrl, // 传递处理后的URL
            skjsonindex: '0'
        }
    })
}

/**
 * 相关推荐
 * @param {string|number} typeId 视频类型ID
 * @returns {Promise} 请求Promise
 */
export const getRelatedDramaService = (typeId) => {
    // 打印传入的typeId参数
    console.log('调用getRelatedDramaService，typeId:', typeId, '类型:', typeof typeId)

    // 确保typeId是有效值
    const finalTypeId = typeId || 1

    return request({
        url: '/vod/list', // 添加前导斜杠
        method: 'get',
        params: {
            typeId: finalTypeId,
            page: '1',
            limit: '10',
            type: 'randomlike'
        }
    })
}