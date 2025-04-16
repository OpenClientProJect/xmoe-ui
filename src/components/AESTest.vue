<template>
  <div class="aes-test-container">
    <h3>AES解密测试</h3>
    
    <div class="form-group">
      <label>(Key):</label>
      <input v-model="key" type="text" placeholder="输入16字节密钥" />
    </div>
    
    <div class="form-group">
      <label>(IV):</label>
      <input v-model="iv" type="text" placeholder="输入16字节初始向量" />
    </div>
    
    <div class="form-group">
      <label>密文:</label>
      <textarea v-model="ciphertext" placeholder="输入十六进制格式的密文"></textarea>
    </div>
    
    <div class="button-group">
      <button @click="decrypt">解密</button>
      <button @click="useExampleData">使用示例数据</button>
    </div>
    
    <div class="result-group" v-if="result">
      <h4>解密结果:</h4>
      <div class="result-box">{{ result }}</div>
    </div>
    
    <div class="error-message" v-if="error">
      <p>错误: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { decryptHexString } from '@/utils/aesUtils';

// 定义状态
const key = ref('');
const iv = ref('');
const ciphertext = ref('');
const result = ref('');
const error = ref('');

// 使用示例数据
const useExampleData = () => {
  key.value = 'ygcnbclnqzsmebxd';
  iv.value = '8249692684143708';
  ciphertext.value = 'B27BA8BE1918FFDF76294BCEA831E51BD50A88B069F82A99DF056B0BA20F1AA8F58917BDDFE80D9B59A2BCCCFF492FDB814EE97CFF5062830FB9ADB9ACE1F13F33991FF3E212C422A76AE9E3E23707ECD8CA4CEA7B3E607102754C064E8BA7DFBFECB83DF3FAF2D34521B1C079BC51E4FD8AFCD2253C5CE386BF4705A53102546C99CE047A5FD333F516DF77FD23102CF3B7DF8EAD961F277AECDC05DB2D518F29F909F41CC02073980E0DCD6C0331266C0F48FB074D87EC9563E7AAB5208ED9E880A18BDB6C0F05B37C2EFF4BF0FEF02002D34CDD358E6C938BC56D9C24345F8ECB636D6D440B723999452C6F316331497469181308CC6DFF965C93C8C946A101112E7D9331AB65A69FE2CE3DC31DDD709753A351AAA268A9590B57FA984E6F052F41ACCAAE9BB5118171C6FD1F12C24119828EE53E89832E5F0F965E54765F422B701A2B9B762E8127AC422D1A69E62213546B08AAE06A0BDE053384FC8D47';
};

// 执行解密
const decrypt = () => {
  // 清除之前的结果
  result.value = '';
  error.value = '';
  
  // 验证输入
  // if (!key.value || !iv.value || !ciphertext.value) {
  //   error.value = '请填写所有字段';
  //   return;
  // }
  
  try {
    // 执行解密
    const decrypted = decryptHexString(ciphertext.value);
    
    if (!decrypted) {
      error.value = '解密失败或结果为空';
      return;
    }
    
    result.value = decrypted;
  } catch (err) {
    error.value = err.message || '解密过程中发生错误';
    console.error('解密错误:', err);
  }
};
</script>

<style scoped>
.aes-test-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8f9fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: monospace;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.button-group {
  margin: 20px 0;
  display: flex;
  gap: 10px;
}

.button-group button {
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button-group button:hover {
  background-color: #0069d9;
}

.result-group {
  margin-top: 20px;
  padding: 15px;
  background-color: #e8f4ff;
  border-radius: 4px;
}

.result-box {
  padding: 10px;
  background-color: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}

.error-message {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  color: #721c24;
}
</style> 