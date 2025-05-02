/**
 * 图片工具函数
 */
import Loading from '@/assets/gif/loading.gif'

// 默认占位图 URL
const DEFAULT_PLACEHOLDER = Loading

/**
 * 处理图片URL，解决豆瓣图片防盗链问题和图片加载失败问题
 * @param {string} url 原始图片URL
 * @returns {string} 处理后的图片URL
 */
export const handleImageUrl = (url) => {
  if (!url || url === 'undefined' || url === 'null') {
    return DEFAULT_PLACEHOLDER;
  }
  
  // 检查是否为相对路径
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url; // 无需处理相对路径
  }
  
  // 防止非法URL
  try {
    new URL(url);
  } catch (e) {
    console.warn('无效的URL格式:', url);
    return DEFAULT_PLACEHOLDER;
  }
  
  // 豆瓣图片防盗链处理
  if (url.includes('doubanio.com') || url.includes('douban.com')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  }
  
  // B站图片防盗链处理
  if (url.includes('hdslb.com') || url.includes('i0.hdslb.com')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  }
  
  // 其他可能有防盗链的站点
  if (url.includes('alicdn.com') || url.includes('aliyuncs.com')) {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  }
  
  return url;
}

/**
 * 通用图片加载错误处理函数
 * @param {Event} event 错误事件对象
 */
export const handleImageError = (event) => {
  console.warn('图片加载失败，使用默认图片替代:', event.target.src);
  event.target.src = DEFAULT_PLACEHOLDER;
  event.target.classList.add('image-error');
  
  // 避免循环触发错误
  event.target.onerror = null;
} 