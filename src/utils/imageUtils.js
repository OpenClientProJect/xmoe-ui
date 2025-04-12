/**
 * 图片工具函数
 */

/**
 * 处理图片URL，解决豆瓣图片防盗链问题
 * @param {string} url 原始图片URL
 * @returns {string} 处理后的图片URL
 */
export const handleImageUrl = (url) => {
  if (!url) return '';
  
  // 检查是否为豆瓣图片链接
  if (url.includes('doubanio.com') || url.includes('douban.com')) {
    // 使用图片缓存服务
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  }
  
  // 检查是否为B站图片链接
  if (url.includes('hdslb.com') || url.includes('i0.hdslb.com')) {
    // B站图片也可能存在防盗链，使用相同处理方法
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
  }
  
  return url;
} 