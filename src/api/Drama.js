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
  
  // 移除所有不安全的请求头，直接发送请求
  return request.get('/vod/list', {
    params: finalParams
    // 不设置任何浏览器限制的请求头
  })
}

/**
 * 获取番剧详情
 * @param {string|number} id 番剧ID
 * @returns {Promise} 请求Promise
 */
export const getDramaDetailService = (id) => {
  if (!id) {
    return Promise.reject(new Error('缺少视频ID参数'))
  }
  
  return request.get(`/vod/detail`, {
    params: { id }
    // 不设置任何浏览器限制的请求头
  })
}

/**
 * 搜索番剧
 * @param {string} keyword 搜索关键词
 * @param {Object} params 其他参数
 * @returns {Promise} 请求Promise
 */
export const searchDramaService = (keyword, params = {}) => {
  if (!keyword) {
    return Promise.reject(new Error('缺少搜索关键词'))
  }
  
  const defaultParams = {
    page: 1,
    limit: 20
  }
  
  const finalParams = { 
    ...defaultParams, 
    ...params,
    keyword
  }
  
  return request.get('/vod/search', {
    params: finalParams
    // 不设置任何浏览器限制的请求头
  })
}

/**
 * 番剧详情页数据
 * @param {string|number} id 番剧ID
 * @returns {Promise} 请求Promise
 */
export const getDramaDetailDataService = (id) => {
  return request.get('/vod/list', {
    params: {
      typeId: 1,
      page: 1,
      limit: 18,
      type: 'updateTime'
    }
    // 不设置任何浏览器限制的请求头
  })
}