/**
 * AES解密工具
 * 基于CryptoJS库实现AES-CBC解密功能
 */
import CryptoJS from 'crypto-js';

/**
 * 将十六进制字符串转换为字节数组
 * @param {string} hexString 十六进制字符串
 * @returns {WordArray} CryptoJS词组数组
 */
export const hexStringToBytes = (hexString) => {
  return CryptoJS.enc.Hex.parse(hexString);
};

/**
 * AES-CBC-PKCS5Padding解密
 * @param {string} ciphertext 十六进制格式的密文
 * @param {string} key 解密密钥
 * @param {string} iv 初始化向量
 * @returns {string} 解密后的明文
 */
export const decryptAES = (ciphertext, key, iv) => {
  try {
    // 如果输入的是十六进制字符串，先转换为字节数组
    const ciphertextBytes = typeof ciphertext === 'string' 
      ? hexStringToBytes(ciphertext) 
      : ciphertext;
    
    // 创建key和iv的WordArray对象
    const keyBytes = CryptoJS.enc.Utf8.parse(key);
    const ivBytes = CryptoJS.enc.Utf8.parse(iv);
    
    // 配置解密选项
    const options = {
      iv: ivBytes,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    };
    
    // 执行解密
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertextBytes }, 
      keyBytes, 
      options
    );
    
    // 转换为UTF-8字符串
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('AES解密失败:', error);
    return '';
  }
};

/**
 * 完整的AES解密方法，模拟Java示例中的功能
 * @param {string} hexString 十六进制格式的密文
 * @param {string} key 解密密钥
 * @param {string} iv 初始化向量
 * @returns {string} 解密后的明文
 */
export const decryptHexString = (hexString, key = 'ygcnbclnqzsmebxd', iv = '8249692684143708') => {
  return decryptAES(hexString, key, iv);
};

// 测试函数，用于测试解密功能
export const testDecryption = () => {
  const key = 'ygcnbclnqzsmebxd';
  const iv = '8249692684143708';
  const hexString = 'B27BA8BE1918FFDF76294BCEA831E51BD50A88B069F82A99DF056B0BA20F1AA8F58917BDDFE80D9B59A2BCCCFF492FDB814EE97CFF5062830FB9ADB9ACE1F13F33991FF3E212C422A76AE9E3E23707ECD8CA4CEA7B3E607102754C064E8BA7DFBFECB83DF3FAF2D34521B1C079BC51E4FD8AFCD2253C5CE386BF4705A53102546C99CE047A5FD333F516DF77FD23102CF3B7DF8EAD961F277AECDC05DB2D518F29F909F41CC02073980E0DCD6C0331266C0F48FB074D87EC9563E7AAB5208ED9E880A18BDB6C0F05B37C2EFF4BF0FEF02002D34CDD358E6C938BC56D9C24345F8ECB636D6D440B723999452C6F316331497469181308CC6DFF965C93C8C946A101112E7D9331AB65A69FE2CE3DC31DDD709753A351AAA268A9590B57FA984E6F052F41ACCAAE9BB5118171C6FD1F12C24119828EE53E89832E5F0F965E54765F422B701A2B9B762E8127AC422D1A69E62213546B08AAE06A0BDE053384FC8D47';
  
  console.log('开始解密测试...');
  
  try {
    const decrypted = decryptHexString(hexString, key, iv);
    console.log('解密结果:', decrypted);
    return decrypted;
  } catch (error) {
    console.error('解密测试失败:', error);
    return null;
  }
}; 