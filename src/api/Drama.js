import request from '@/utils/request.js'

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
    params: finalParams,
    headers: {
      'User-Agent': 'Dart/2.10 (dartio)',
      'Accept-Encoding': 'gzip',
      'content-length': '0'
    }
  })
}