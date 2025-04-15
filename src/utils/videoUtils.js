/**
 * 视频工具函数
 * 提供处理视频URL和HLS播放配置的工具方法
 */

/**
 * 处理视频URL，处理跨域访问和添加文件扩展名
 * @param {string} url 原始视频URL
 * @returns {string} 处理后的视频URL
 */
export const handleVideoUrl = (url) => {
  if (!url) return '';
  
  // 处理已经是相对路径的情况
  if (url.startsWith('/cloud/')) {
    return url;  // 已经是代理URL，不需要处理
  }
  
  // 处理绝对路径
  try {
    const urlObj = new URL(url);
    
    // 检查是否为HLS流媒体但没有扩展名
    if (!urlObj.pathname.endsWith('.m3u8') && 
        !urlObj.pathname.endsWith('.mp4') &&
        !urlObj.pathname.endsWith('.ts')) {
      
      // 根据URL特征判断类型并添加扩展名
      if (url.includes('playlist') || url.includes('chunklist')) {
        url = url + (url.includes('?') ? '&' : '?') + 'format=m3u8';
      } else {
        // 默认当做mp4处理
        url = url + (url.includes('?') ? '&' : '?') + 'format=mp4';
      }
    }
    
    // 如果是外部域名，并且不是代理地址，考虑使用代理
    if (!urlObj.host.includes('localhost') && 
        !urlObj.host.includes('127.0.0.1') && 
        !url.startsWith('/api/') && 
        !url.startsWith('/cloud/')) {
      
      // 如果是cloud.xmoe.app，转为相对路径使用代理
      if (urlObj.host === 'cloud.xmoe.app') {
        return `/cloud${urlObj.pathname}${urlObj.search}`;
      }
      
      // 其他外部链接可以保持不变，让播放器直接访问
      return url;
    }
  } catch (error) {
    console.error('URL解析错误:', error);
  }
  
  return url;
};

/**
 * 创建HLS配置
 * @param {boolean} needsHeaders 是否需要包含HTTP头
 * @returns {Object} HLS配置对象
 */
export const createHlsConfig = (needsHeaders = false) => {
  const config = {
    // 基本配置
    debug: false,
    enableWorker: true,
    lowLatencyMode: false,
    
    // 加载配置
    maxBufferLength: 30,
    maxBufferSize: 10 * 1000 * 1000, // 10MB
    maxBufferHole: 0.5,
    maxStarvationDelay: 4,
    
    // 恢复配置
    maxLoadingDelay: 4,
    maxRetryCount: 3,
    retryDelay: 1000,
    
    // 质量控制
    startLevel: -1, // 自动选择
    
    // XHR配置
    xhrSetup: function(xhr) {
      xhr.withCredentials = false; // 不发送凭证
      
      if (needsHeaders) {
        // 设置额外的请求头，如需要时添加
        // xhr.setRequestHeader('X-Custom-Header', 'value');
      }
    }
  };
  
  return config;
};

/**
 * 获取视频元数据
 * @param {string} url 视频URL
 * @returns {Promise<Object>} 包含视频元数据的Promise
 */
export const getVideoMetadata = (url) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight
      });
      video.remove();
    };
    
    video.onerror = () => {
      reject(new Error('无法加载视频元数据'));
      video.remove();
    };
    
    // 超时处理
    setTimeout(() => {
      if (!video.duration) {
        reject(new Error('加载视频元数据超时'));
        video.remove();
      }
    }, 5000);
  });
}; 