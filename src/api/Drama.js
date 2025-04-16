import request from '@/utils/request.js'
import { decryptHexString } from '@/utils/aesUtils'

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
  const finalParams = { ...defaultParams, ...params }
  
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
 * 获取视频播放地址
 * @param {string} id 视频ID（可能是加密的）
 * @returns {Promise} 包含播放地址的Promise
 */
export const getVideoPlayUrlService = (id) => {
  // 检查ID是否是加密格式
  if (id.startsWith('MOE')) {
    // 直接返回代理地址
    return Promise.resolve({ code: 200, data: { url: `/cloud/${id}` } })
  } else if (id.startsWith('id_')) {
    // 移除前缀
    const realId = id.substring(3)
    // 返回代理地址
    return Promise.resolve({ code: 200, data: { url: `/cloud/${realId}` } })
  } else {
    // 尝试解密ID
    try {
      const decryptedUrl = decryptHexString(id)
      if (decryptedUrl) {
        return Promise.resolve({ code: 200, data: { url: decryptedUrl } })
      } else {
        return Promise.reject(new Error('解密视频地址失败'))
      }
    } catch (error) {
      console.error('解析视频ID失败:', error)
      return Promise.reject(error)
    }
  }
}
