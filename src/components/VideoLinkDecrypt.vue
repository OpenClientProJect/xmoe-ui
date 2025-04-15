<template>
  <div class="video-link-decrypt-container">
    <h3>视频链接解密工具</h3>
    
    <div class="form-group">
      <label>密钥 (Key):</label>
      <input v-model="key" type="text" placeholder="输入16字节密钥" />
    </div>
    
    <div class="form-group">
      <label>初始向量 (IV):</label>
      <input v-model="iv" type="text" placeholder="输入16字节初始向量" />
    </div>
    
    <div class="form-group">
      <label>加密的视频链接 (十六进制格式):</label>
      <textarea v-model="encryptedUrl" placeholder="输入十六进制格式的加密视频链接"></textarea>
    </div>
    
    <div class="button-group">
      <button @click="decrypt">解密</button>
      <button @click="useDefaultKeys">使用默认密钥</button>
      <button @click="clear">清空</button>
    </div>
    
    <div class="result-group" v-if="decryptedUrl">
      <h4>解密结果:</h4>
      <div class="result-box">{{ decryptedUrl }}</div>
      <div class="button-group">
        <button @click="copyToClipboard" class="secondary-button">复制链接</button>
        <button @click="openInNewTab" class="secondary-button">在新标签页打开</button>
        <button @click="playVideo" class="primary-button">播放视频</button>
      </div>
    </div>
    
    <div v-if="showPlayer" class="video-player-container">
      <h4>视频播放器</h4>
      <div ref="playerRef" class="artplayer-container"></div>
    </div>
    
    <div class="error-message" v-if="error">
      <p>错误: {{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { decryptHexString } from '@/utils/aesUtils';
import Artplayer from 'artplayer';
import Hls from 'hls.js';
import { createHlsConfig, handleVideoUrl } from '@/utils/videoUtils';

// 定义状态
const key = ref('');
const iv = ref('');
const encryptedUrl = ref('');
const decryptedUrl = ref('');
const error = ref('');
const showPlayer = ref(false);
const playerRef = ref(null);
const player = ref(null);

// 使用默认密钥
const useDefaultKeys = () => {
  key.value = 'ygcnbclnqzsmebxd';
  iv.value = '8249692684143708';
};

// 清空所有输入和结果
const clear = () => {
  encryptedUrl.value = '';
  decryptedUrl.value = '';
  error.value = '';
  showPlayer.value = false;
  destroyPlayer();
};

// 执行解密
const decrypt = () => {
  // 清除之前的结果
  decryptedUrl.value = '';
  error.value = '';
  showPlayer.value = false;
  destroyPlayer();
  
  // 验证输入
  if (!key.value || !iv.value || !encryptedUrl.value) {
    error.value = '请填写所有字段';
    return;
  }
  
  try {
    // 执行解密
    const result = decryptHexString(encryptedUrl.value, key.value, iv.value);
    
    if (!result) {
      error.value = '解密失败或结果为空';
      return;
    }
    
    // 验证结果是否为有效URL
    try {
      new URL(result);
      decryptedUrl.value = result;
    } catch (e) {
      decryptedUrl.value = result;
      error.value = '警告: 解密结果不是有效的URL，可能解密不正确';
    }
  } catch (err) {
    error.value = err.message || '解密过程中发生错误';
    console.error('解密错误:', err);
  }
};

// 复制链接到剪贴板
const copyToClipboard = () => {
  if (!decryptedUrl.value) return;
  
  navigator.clipboard.writeText(decryptedUrl.value)
    .then(() => {
      const originalError = error.value;
      error.value = '已复制到剪贴板';
      setTimeout(() => {
        error.value = originalError;
      }, 2000);
    })
    .catch(err => {
      error.value = '复制失败: ' + err.message;
    });
};

// 在新标签页打开链接
const openInNewTab = () => {
  if (!decryptedUrl.value) return;
  
  try {
    window.open(decryptedUrl.value, '_blank');
  } catch (err) {
    error.value = '打开链接失败: ' + err.message;
  }
};

// 初始化视频播放器
const initPlayer = (url) => {
  if (!playerRef.value) return;
  
  destroyPlayer();
  
  const processedUrl = handleVideoUrl(url);
  const options = {
    container: playerRef.value,
    url: processedUrl,
    title: '解密视频',
    volume: 0.5,
    isLive: false,
    muted: false,
    autoplay: false,
    pip: true,
    autoSize: true,
    autoMini: true,
    screenshot: true,
    setting: true,
    playbackRate: true,
    fullscreen: true,
    fullscreenWeb: true,
    subtitleOffset: true,
    miniProgressBar: true,
    airplay: true,
    theme: '#23ade5',
    lang: navigator.language.toLowerCase(),
    whitelist: ['*'],
    customType: {
      m3u8: function(video, url) {
        if (Hls.isSupported()) {
          const config = createHlsConfig(true);
          const hls = new Hls(config);
          hls.loadSource(url);
          hls.attachMedia(video);
          
          // 添加到实例以便清理
          if (!player.value.$hls) {
            player.value.$hls = [];
          }
          player.value.$hls.push(hls);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = url;
        } else {
          player.value.notice.show('您的浏览器不支持HLS播放');
        }
      }
    }
  };
  
  player.value = new Artplayer(options);
};

// 播放视频
const playVideo = () => {
  if (!decryptedUrl.value) return;
  
  showPlayer.value = true;
  
  // 使用nextTick确保DOM已更新
  setTimeout(() => {
    try {
      initPlayer(decryptedUrl.value);
    } catch (err) {
      error.value = '初始化播放器失败: ' + err.message;
      console.error('播放器初始化错误:', err);
    }
  }, 100);
};

// 销毁播放器实例
const destroyPlayer = () => {
  if (player.value) {
    player.value.destroy();
    player.value = null;
  }
};

// 组件卸载前清理
onBeforeUnmount(() => {
  destroyPlayer();
});
</script>

<style scoped>
.video-link-decrypt-container {
  max-width: 900px;
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
  flex-wrap: wrap;
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

.button-group .secondary-button {
  background-color: #6c757d;
}

.button-group .secondary-button:hover {
  background-color: #5a6268;
}

.button-group .primary-button {
  background-color: #28a745;
}

.button-group .primary-button:hover {
  background-color: #218838;
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

.video-player-container {
  margin-top: 30px;
}

.artplayer-container {
  width: 100%;
  height: 500px;
  max-height: 60vh;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .artplayer-container {
    height: 300px;
  }
}
</style> 