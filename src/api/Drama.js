import request from '@/utils/request.js'
import { decryptHexString } from '@/utils/aesUtils'
import { parseVideoId, parseRC4D } from '@/utils/rc4Utils'

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
  if (!id) {
    return Promise.reject(new Error('无效的视频ID'))
  }
  
  try {
    let url = ''
    console.log('处理视频ID:', id);
    
    // 处理可能含有"第XX集$"前缀和"#"后缀的情况
    // 先去除结尾的#号
    if (id.endsWith('#')) {
      id = id.substring(0, id.length - 1);
      console.log('去除#后的ID:', id);
    }
    
    // 检查是否有"第XX集$"格式的前缀
    const episodePrefixMatch = id.match(/^第\d+集\$/);
    if (episodePrefixMatch) {
      const prefix = episodePrefixMatch[0];
      id = id.substring(prefix.length);
      console.log('去除前缀后的ID:', id);
    }
    
    // 检查ID格式
    if (id.startsWith('MOE')) {
      // MOE开头的ID，使用RC4解密
      console.log('检测到MOE前缀的ID');
      url = parseVideoId(id)
      if (!url) {
        console.error('MOE前缀ID解析失败:', id);
        // 如果解析失败，返回直链
        url = `/cloud/${id}`
      }
    } else if (id.startsWith('id_MOE') || id.startsWith('id_XS')) {
      // id_MOE或id_XS开头的ID，使用RC4解密
      console.log('检测到id_MOE/id_XS前缀的ID');
      url = parseVideoId(id)
      if (!url) {
        // 如果解析失败，尝试直接返回路径
        const prefix = id.startsWith('id_MOE') ? 'MOE' : 'XS';
        const realId = id.substring(id.indexOf(prefix) + prefix.length);
        console.log('解析失败，使用直接路径:', realId);
        url = `/cloud/${prefix}${realId}`
      }
    } else if (/^[0-9A-Fa-f]+$/.test(id)) {
      // 纯十六进制字符串，尝试先用RC4解密
      console.log('检测到十六进制字符串');
      try {
        url = parseRC4D(id)
        console.log('RC4解密结果:', url);
        // 验证是否为有效URL
        if (!url || (!url.startsWith('http') && !url.startsWith('rtmp'))) {
          console.log('RC4解密结果无效，尝试AES解密');
          // 如果RC4解密失败，尝试使用AES解密
          url = decryptHexString(id)
          console.log('AES解密结果:', url);
        }
      } catch (e) {
        console.error('RC4解密失败，尝试AES解密', e);
        // RC4解密失败，尝试AES解密
        url = decryptHexString(id)
      }
    } else {
      // 其他格式，直接返回代理地址
      console.log('未知格式，直接返回代理地址');
      url = `/cloud/${id}`
    }
    
    if (!url) {
      console.error('所有解析方法都失败，无法获取视频URL');
      return Promise.reject(new Error('解析视频播放地址失败'))
    }
    
    console.log('最终解析出的URL:', url);
    
    // 添加代理前缀，如果是本地URL但没有/cloud前缀
    if (!url.startsWith('http') && !url.startsWith('rtmp') && !url.startsWith('/cloud')) {
      url = `/cloud/${url}`;
    }
    
    return Promise.resolve({ code: 200, data: { url } })
  } catch (error) {
    console.error('视频播放地址解析失败:', error)
    return Promise.reject(error)
  }
}
