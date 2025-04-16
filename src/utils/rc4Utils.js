/**
 * RC4加密解密工具类
 * 参考Java实现
 */

// 默认密钥，与Java代码保持一致
const DEFAULT_KEY = '123654';

/**
 * RC4加密/解密算法
 * @param {string} input 输入字符串
 * @param {string} key 密钥
 * @returns {string} 加密/解密后的字符串
 */
const RC4 = (input, key) => {
  const iS = new Array(256);
  const iK = new Array(256);
  
  // 初始化数组
  for (let i = 0; i < 256; i++) {
    iS[i] = i;
  }
  
  // 初始化密钥数组
  for (let i = 0; i < 256; i++) {
    iK[i] = key.charCodeAt(i % key.length);
  }
  
  // 初始置换
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + iS[i] + iK[i]) % 256;
    // 交换 iS[i] 和 iS[j]
    [iS[i], iS[j]] = [iS[j], iS[i]];
  }
  
  // 加密/解密
  let i = 0;
  j = 0;
  const inputChars = input.split('');
  const outputChars = new Array(inputChars.length);
  
  for (let x = 0; x < inputChars.length; x++) {
    i = (i + 1) % 256;
    j = (j + iS[i]) % 256;
    // 交换 iS[i] 和 iS[j]
    [iS[i], iS[j]] = [iS[j], iS[i]];
    
    const t = (iS[i] + iS[j]) % 256;
    const iY = iS[t];
    outputChars[x] = String.fromCharCode(inputChars[x].charCodeAt(0) ^ iY);
  }
  
  return outputChars.join('');
};

/**
 * 将字符串转换为十六进制字符串
 * @param {string} s 输入字符串
 * @returns {string} 十六进制字符串
 */
const toHexString = (s) => {
  let str = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    let s4 = (ch & 0xFF).toString(16);
    if (s4.length === 1) {
      s4 = '0' + s4;
    }
    str += s4;
  }
  return str;
};

/**
 * 将十六进制字符串转换为字符串
 * @param {string} hexString 十六进制字符串
 * @returns {string} 普通字符串
 */
const hexToString = (hexString) => {
  // 确保十六进制字符串长度是偶数
  if (hexString.length % 2 !== 0) {
    hexString = '0' + hexString;
  }
  
  // 移除可能存在的空格和其他非法字符
  hexString = hexString.replace(/[^0-9A-Fa-f]/g, '');
  
  const result = [];
  for (let i = 0; i < hexString.length; i += 2) {
    const hex = hexString.substring(i, i + 2);
    try {
      const decimal = parseInt(hex, 16);
      result.push(String.fromCharCode(decimal));
    } catch (e) {
      console.error('解析十六进制字符失败:', hex, e);
    }
  }
  return result.join('');
};

/**
 * RC4加密
 * @param {string} videoUrl 待加密的URL
 * @param {string} key 密钥，默认使用DEFAULT_KEY
 * @returns {string} 加密后的十六进制字符串
 */
export const encryptRC4D = (videoUrl, key = DEFAULT_KEY) => {
  const str = RC4(videoUrl, key);
  return toHexString(str).toUpperCase();
};

/**
 * RC4解密
 * @param {string} RC4D 加密后的十六进制字符串
 * @param {string} key 密钥，默认使用DEFAULT_KEY
 * @returns {string} 解密后的字符串
 */
export const parseRC4D = (RC4D, key = DEFAULT_KEY) => {
  try {
    // 预处理输入，确保是有效的十六进制字符串
    if (!RC4D || typeof RC4D !== 'string') {
      return '';
    }
    
    // 清理输入中可能存在的非十六进制字符
    const cleanHexString = RC4D.replace(/[^0-9A-Fa-f]/g, '');
    if (!cleanHexString) {
      return '';
    }
    
    // 将十六进制转为字符串并进行RC4解密
    return RC4(hexToString(cleanHexString), key);
  } catch (error) {
    console.error('RC4解密失败:', error);
    return '';
  }
};

/**
 * 解析视频播放链接ID
 * @param {string} id 视频ID
 * @returns {string} 解析后的URL
 */
export const parseVideoId = (id) => {
  if (!id) return '';
  
  console.log('原始视频ID:', id);
  
  // 先去除结尾的#号
  if (id.endsWith('#')) {
    id = id.substring(0, id.length - 1);
  }
  
  // 检查是否有"第XX集$"格式的前缀
  const episodePrefixMatch = id.match(/^第\d+集\$/);
  if (episodePrefixMatch) {
    const prefix = episodePrefixMatch[0];
    id = id.substring(prefix.length);
    console.log('去除前缀后:', id);
  }
  
  // 去除前缀
  let encryptedUrl = id;
  if (id.startsWith('MOE')) {
    encryptedUrl = id.substring(3);
  } else if (id.startsWith('id_MOE')) {
    encryptedUrl = id.substring(6);
  } else if (id.startsWith('id_XS')) {
    encryptedUrl = id.substring(5);
  }
  
  console.log('提取加密内容:', encryptedUrl);
  
  // 确保是有效的十六进制字符串
  if (!/^[0-9A-Fa-f]+$/.test(encryptedUrl)) {
    console.warn('输入不是有效的十六进制字符串:', encryptedUrl);
    return '';
  }
  
  // 解密URL
  try {
    const decrypted = parseRC4D(encryptedUrl);
    // 简单验证解密结果是否为有效URL（至少应该包含http）
    if (decrypted && (decrypted.includes('http') || decrypted.includes('rtmp'))) {
      console.log('解密成功, URL:', decrypted);
      return decrypted;
    } else {
      console.warn('解密结果不是有效URL:', decrypted);
      return '';
    }
  } catch (error) {
    console.error('解析视频ID失败:', error);
    return '';
  }
};

/**
 * 解析完整的vod_play_url字段
 * @param {string} vodPlayUrl 包含多个播放源的URL字符串
 * @returns {string} 解析后的URL字符串
 */
export const decryptVodPlayUrl = (vodPlayUrl) => {
  if (!vodPlayUrl || vodPlayUrl.length === 0) {
    return vodPlayUrl;
  }
  
  // 分割多个播放源，以 $$$ 为分隔符
  const playSources = vodPlayUrl.split('$$$');
  const decryptedUrl = [];
  
  // 遍历每个播放源
  for (let i = 0; i < playSources.length; i++) {
    // 分割同一播放源中的多个剧集链接，以 # 为分隔符
    const episodes = playSources[i].split('#');
    const decryptedSource = [];
    
    for (let j = 0; j < episodes.length; j++) {
      const episode = episodes[j];
      
      // 提取剧集标题和加密URL
      const separatorIndex = episode.indexOf('$');
      if (separatorIndex > -1) {
        const title = episode.substring(0, separatorIndex); // 不包含分隔符 $
        const encryptedUrl = episode.substring(separatorIndex + 1);
        
        // 解析视频ID
        const decrypted = parseVideoId(encryptedUrl);
        if (decrypted) {
          decryptedSource.push(title + decrypted);
        } else {
          decryptedSource.push(episode); // 解密失败，保持原样
        }
      } else {
        decryptedSource.push(episode);
      }
    }
    
    decryptedUrl.push(decryptedSource.join(','));
  }
  
  return decryptedUrl.join(',');
};

/**
 * 测试函数
 */
export const testRC4 = () => {
  const testString = 'https://example.com/video/12345';
  const encrypted = encryptRC4D(testString);
  console.log('加密后:', encrypted);
  
  const decrypted = parseRC4D(encrypted);
  console.log('解密后:', decrypted);
  
  return { encrypted, decrypted };
}; 