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
  
  console.log('处理视频URL:', url);
  
  // 处理已经是相对路径的情况
  if (url.startsWith('/cloud/')) {
    console.log('已经是代理URL，不需要处理');
    return url;  // 已经是代理URL，不需要处理
  }
  
  // 如果URL不是HTTP或RTMP开头，可能是一个ID或相对路径
  if (!url.startsWith('http') && !url.startsWith('rtmp') && !url.startsWith('/')) {
    console.log('URL不是完整URL，视为ID处理');
    return `/cloud/${url}`;
  }
  
  // 处理绝对路径
  try {
    const urlObj = new URL(url);
    console.log('解析URL:', urlObj.href);
    
    // 检查是否为HLS流媒体但没有扩展名
    if (!urlObj.pathname.endsWith('.m3u8') && 
        !urlObj.pathname.endsWith('.mp4') &&
        !urlObj.pathname.endsWith('.ts') &&
        !urlObj.pathname.endsWith('.flv')) {
      
      // 根据URL特征判断类型并添加扩展名
      if (url.includes('playlist') || url.includes('chunklist') || url.includes('manifest')) {
        console.log('检测到流媒体特征，添加m3u8格式标识');
        url = url + (url.includes('?') ? '&' : '?') + 'format=m3u8';
      } else {
        // 默认当做mp4处理
        console.log('未检测到特殊格式，默认添加mp4格式标识');
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
        console.log('检测到cloud.xmoe.app域名，使用内部代理');
        return `/cloud${urlObj.pathname}${urlObj.search}`;
      }
      
      // 如果是已知的视频流媒体服务，考虑是否需要代理
      if (urlObj.host.includes('cdn') || 
          urlObj.host.includes('stream') || 
          urlObj.host.includes('media') ||
          url.includes('.m3u8')) {
        console.log('检测到流媒体服务，考虑是否需要代理');
        
        // 这里可以添加代理逻辑，如果需要的话
        // 例如: return `/api/proxy?url=${encodeURIComponent(url)}`;
      }
      
      // 其他外部链接可以保持不变，让播放器直接访问
      console.log('使用原始外部URL');
      return url;
    }
  } catch (error) {
    console.error('URL解析错误:', error);
    
    // 如果无法解析为URL，但以/开头，可能是相对路径
    if (url.startsWith('/') && !url.startsWith('/cloud/') && !url.startsWith('/api/')) {
      console.log('无法解析但以/开头，添加cloud前缀');
      return `/cloud${url}`;
    }
  }
  
  console.log('返回处理后的URL:', url);
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