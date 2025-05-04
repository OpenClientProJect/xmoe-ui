<script setup>
import {ref, onMounted, onUnmounted, watch} from 'vue'
import Artplayer from 'artplayer'
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'
import {ElMessage} from 'element-plus'
import {ArrowLeft} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router'

import Next from '@/assets/icon/Next.svg'
import Loading from '@/assets/gif/loading.gif'
import Left from '@/assets/icon/left.svg'
import Right from '@/assets/icon/right.svg'
import Return from '@/assets/icon/return.svg'
// 获取路由实例
const router = useRouter()

// 定义组件属性
const props = defineProps({
  // 视频URL
  url: {
    type: String,
    required: true
  },
  // 视频标题
  title: {
    type: String,
    default: ''
  },
  // 视频封面
  poster: {
    type: String,
    default: ''
  },
  // 视频ID，用于保存播放进度
  videoId: {
    type: String,
    default: ''
  },
  // 是否自动播放
  autoplay: {
    type: Boolean,
    default: true
  },
  // 是否显示返回按钮
  showBackButton: {
    type: Boolean,
    default: false
  },
  // 是否显示侧边栏
  showSidebar: {
    type: Boolean,
    default: true
  },
  // 弹幕数据
  danmaku: {
    type: Array,
    default: () => []
  },
  // 下一集按钮点击回调
  onNextEpisode: {
    type: Function,
    default: null
  },
  // 用户是否已登录
  isLoggedIn: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['play', 'pause', 'ended', 'timeupdate', 'error', 'back', 'toggleSidebar', 'next', 'login'])

// 播放器容器引用
const artRef = ref(null)
// 播放器实例
const artInstance = ref(null)
// 创建ResizeObserver来处理缩放事件
let resizeObserver = null
let resizeTimeout = null
// 控制返回按钮显示状态
const isControlsVisible = ref(false)
// 控制延迟隐藏的定时器
let hideControlsTimer = null
// 当前视频URL
const currentVideoUrl = ref('')

// 显示控制栏
const showControls = () => {
  isControlsVisible.value = true;

  // 清除现有的隐藏定时器
  if (hideControlsTimer) {
    clearTimeout(hideControlsTimer);
  }

  // 设置延迟隐藏定时器
  hideControlsTimer = setTimeout(() => {
    isControlsVisible.value = false;
  }, 3000); // 3秒后自动隐藏
}

// 隐藏控制栏
const hideControls = () => {
  if (hideControlsTimer) {
    clearTimeout(hideControlsTimer);
  }
  hideControlsTimer = setTimeout(() => {
    isControlsVisible.value = false;
  }, 800); // 延迟800毫秒隐藏，避免切换时闪烁
}

// 返回上一页
const goBack = () => {
  emit('back');
  // 如果父组件没有处理back事件，则默认行为是返回首页
  router.push('/');
}

// 节流函数 - 限制函数调用频率
// 在指定的时间间隔内只执行一次函数
function throttle(fn, delay) {
  let lastCall = 0
  return function (...args) {
    const now = new Date().getTime()
    if (now - lastCall < delay) {
      return
    }
    lastCall = now
    return fn(...args)
  }
}

// 处理下一集按钮点击事件
const handleNextEpisode = () => {
  console.log('点击了下一集按钮')
  emit('next')
  if (typeof props.onNextEpisode === 'function') {
    props.onNextEpisode()
  }
}

// 初始化播放器后，添加视频结束事件监听
const setupEventListeners = (art) => {
  // 监听视频结束事件
  art.on('video:ended', () => {
    console.log('视频播放结束，触发ended事件')
    emit('ended')
  })

  // 播放事件
  art.on('play', () => {
    emit('play')
  })
  
  // 暂停事件
  art.on('pause', () => {
    emit('pause')
  })
  
  // 时间更新事件，用于记录播放进度
  art.on('video:timeupdate', throttle(() => {
    // 保存播放进度
    const currentTime = art.currentTime
    if (props.videoId) {
      localStorage.setItem(`video_progress_${props.videoId}`, currentTime.toString())
    }
    emit('timeupdate', currentTime)
  }, 5000)) // 5秒内只执行一次，减少存储操作
}

// 初始化播放器
const initPlayer = (url) => {
  if (!url) {
    console.error('播放URL为空')
    ElMessage.error('播放地址无效')
    emit('error', new Error('播放地址无效'))
    return
  }

  // 保存当前URL供调试
  currentVideoUrl.value = url

  // 如果用户未登录，不初始化播放器，显示登录提示层
  if (!props.isLoggedIn) {
    console.log('用户未登录，不初始化播放器')
    // 清空容器以便显示登录提示层
    if (artRef.value) {
      artRef.value.innerHTML = ''
    }
    return null
  }

  // 添加video-api前缀，使用代理转发
  let videoUrl = url
  // if (url.startsWith('http')) {
  //   // 如果是完整URL，检查是否需要添加前缀
  //   if (!url.includes('/video-api/') && !url.includes('/video-proxy/')) {
  //     videoUrl = `/video-api${new URL(url).pathname}${new URL(url).search}`
  //   }
  // } else {
  //   // 如果是相对路径，直接添加前缀
  //   videoUrl = `/video-api/${url}`
  // }
  console.log('当前视频播放地址:', videoUrl)

  // 如果已经有播放器实例，先销毁
  if (artInstance.value) {
    artInstance.value.destroy()
  }

  try {
    console.log('初始化播放器，URL:', videoUrl)

    // 清空容器
    artRef.value.innerHTML = ''

    // 弹幕插件配置
    const danmukuOptions = {
      danmuku: props.danmaku || [],
      speed: 5, // 弹幕速度
      fontSize: 25, // 弹幕字体大小
      color: '#FFFFFF', // 弹幕默认颜色
      mode: 0, // 弹幕默认模式 0-滚动 1-顶部 2-底部
      margin: [10, 100], // 弹幕上下边距
      antiOverlap: true, // 防重叠
      useWorker: true, // 使用 web worker
      synchronousPlayback: true, // 同步播放
      lockTime: 5, // 输入框锁定时间
      maxLength: 100, // 输入框最大长度
      minWidth: 200, // 输入框最小宽度
      maxWidth: 400, // 输入框最大宽度
      theme: '#DC2626' // 输入框主题色
    }

    // 播放器配置
    const options = {
      container: artRef.value,
      url: videoUrl,
      poster: props.poster,
      title: props.title,
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: props.autoplay,
      pip: true,
      autoSize: false,
      autoMini: false, // 禁用小窗口功能
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: false, // 关闭迷你进度条
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#dc2626',
      lang: 'zh-cn',
      plugins: [
        artplayerPluginDanmuku(danmukuOptions)
      ],
      icons: {
        loading: `<img src="${Loading}" alt="加载中" style="width: 60px; height: 70px;">`,
      },
      controls: [
        {
          position: 'left',
          index: 20, // 设置为2，确保在暂停按钮之后
          name: 'next-episode',
          tooltip: '下一集',
          html: '<div class="next-episode-btn"><img src="' + Next + '" alt="下一集" style="width: 20px; height: 18px;"></div>',
          click: function() {
            handleNextEpisode();
          },
        },
      ],
      moreVideoAttr: {
        crossOrigin: 'anonymous',
        preload: 'metadata',
        'webkit-playsinline': true,
        playsinline: true,
      },
      customType: {
        // 添加对m3u8格式的支持
        m3u8: function (video, url) {
          try {
            if (window.Hls && window.Hls.isSupported()) {
              const hls = new window.Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: false,
                maxBufferLength: 60,
                maxMaxBufferLength: 120,
                maxRetryCount: 5,
                // 设置XHR请求配置
                xhrSetup: function (xhr, url) {
                  // 不发送凭证，避免CORS预检请求
                  xhr.withCredentials = false
                  // 设置请求头
                  xhr.setRequestHeader('Accept', '*/*')
                  xhr.setRequestHeader('Origin', window.location.origin)
                  console.log('HLS请求:', url)
                }
              })

              // 添加错误处理
              hls.on(window.Hls.Events.ERROR, function (event, data) {
                console.error('HLS错误:', data)
                if (data.fatal) {
                  switch (data.type) {
                    case window.Hls.ErrorTypes.NETWORK_ERROR:
                      console.log('HLS网络错误，尝试重新加载')
                      hls.startLoad()
                      break
                    case window.Hls.ErrorTypes.MEDIA_ERROR:
                      console.log('HLS媒体错误，尝试恢复')
                      hls.recoverMediaError()
                      break
                    default:
                      console.error('无法恢复的HLS错误:', data)

                      // 清理资源并触发错误事件
                      try {
                        hls.destroy()
                      } catch (e) {
                        console.error('销毁HLS实例失败:', e)
                      }

                      // 创建一个自定义错误事件并分发
                      if (video) {
                        const errorEvent = new Event('error')
                        video.dispatchEvent(errorEvent)
                      }
                      break
                  }
                }
              })

              // 添加成功事件
              hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                console.log('HLS清单解析成功，准备播放')
                try {
                  video.play().catch(e => {
                    console.error('自动播放失败:', e)
                  })
                } catch (e) {
                  console.error('播放HLS视频失败:', e)
                }
              })

              try {
                hls.loadSource(url)
                hls.attachMedia(video)

                // 保存hls实例以便后续清理
                artInstance.value.$hls = hls
              } catch (e) {
                console.error('HLS加载/附加失败:', e)
              }
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              // 对于Safari等原生支持HLS的浏览器
              console.log('使用浏览器原生HLS支持')
              video.src = url
              video.addEventListener('loadedmetadata', function () {
                try {
                  video.play().catch(e => {
                    console.error('自动播放失败:', e)
                  })
                } catch (e) {
                  console.error('播放HLS视频失败(原生):', e)
                }
              })
            } else {
              console.warn('当前浏览器不支持HLS播放')
              ElMessage.error('您的浏览器不支持此视频格式，请使用Chrome或Edge浏览器')

              // 创建一个自定义错误事件并分发
              if (video) {
                const errorEvent = new Event('error')
                video.dispatchEvent(errorEvent)
              }
            }
          } catch (error) {
            console.error('HLS初始化失败:', error)

            // 创建一个自定义错误事件并分发
            if (video) {
              const errorEvent = new Event('error')
              video.dispatchEvent(errorEvent)
            }
          }
        }
      }
    }

    // 创建播放器实例
    artInstance.value = new Artplayer(options)
    
    // 设置事件监听器
    setupEventListeners(artInstance.value)
    
    console.log('播放器初始化成功:', artInstance.value)
    
    // 恢复播放进度
    if (props.videoId) {
      const savedTime = localStorage.getItem(`video_progress_${props.videoId}`)
      if (savedTime) {
        const timeToSeek = parseFloat(savedTime)
        if (!isNaN(timeToSeek) && timeToSeek > 0) {
          // 等待一点时间确保视频加载完毕
          setTimeout(() => {
            artInstance.value.seek = timeToSeek
            console.log('恢复播放进度到:', timeToSeek)
          }, 1000)
        }
      }
    }
    // 添加video元素错误事件监听
    if (artInstance.value.$video) {
      artInstance.value.$video.onerror = function (e) {
        console.error('视频元素错误:', {
          event: e,
          error: this.error,
          src: this.src,
          currentSrc: this.currentSrc,
          readyState: this.readyState,
          networkState: this.networkState
        });
      };
    }

    return artInstance.value
  } catch (error) {
    console.error('播放器初始化失败:', error)
    emit('error', error)
    return null
  }
}

// 监听URL变化，重新初始化播放器
watch(() => props.url, (newUrl) => {
  console.log('URL发生变化:', newUrl);
  if (newUrl) {
    initPlayer(newUrl)
  }
})

// 组件挂载时初始化播放器
onMounted(() => {
  if (props.url) {
    initPlayer(props.url)
  }

  // 初始化ResizeObserver来处理缩放事件
  try {
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(throttle(entries => {
        // 使用节流函数减少回调频率
        // 在缩放结束后才调整播放器
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          if (artInstance.value && artRef.value && typeof artInstance.value.resize === 'function') {
            // 确保resize方法存在后再调用
            try {
              artInstance.value.resize()
            } catch (e) {
              console.error('播放器resize失败:', e)
            }
          }
        }, 200)
      }, 200))

      // 监听播放器容器的大小变化
      if (artRef.value) {
        resizeObserver.observe(artRef.value)
      }
    }
  } catch (error) {
    console.error('设置ResizeObserver失败:', error)
  }
})

// 组件卸载时销毁播放器和清理资源
onUnmounted(() => {
  // 销毁播放器
  if (artInstance.value) {
    try {
      artInstance.value.destroy()
    } catch (e) {
      console.error('销毁播放器失败:', e)
    }
    artInstance.value = null
  }

  // 清理ResizeObserver
  if (resizeObserver) {
    try {
      resizeObserver.disconnect()
    } catch (e) {
      console.error('断开ResizeObserver失败:', e)
    }
    resizeObserver = null
  }

  // 清理定时器
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
    resizeTimeout = null
  }

  // 清理控制栏隐藏定时器
  if (hideControlsTimer) {
    clearTimeout(hideControlsTimer)
    hideControlsTimer = null
  }
})

// 暴露方法给父组件
defineExpose({
  // 获取播放器实例
  getPlayer: () => artInstance.value,
  // 播放
  play: () => artInstance.value?.play(),
  // 暂停
  pause: () => artInstance.value?.pause(),
  // 切换播放/暂停
  toggle: () => artInstance.value?.toggle(),
  // 设置播放时间
  seek: (time) => {
    if (artInstance.value) {
      artInstance.value.seek = time
    }
  },
  // 设置音量
  setVolume: (volume) => {
    if (artInstance.value) {
      artInstance.value.volume = volume
    }
  }
})

// 切换侧边栏显示/隐藏
const toggleSidebar = () => {
  emit('toggleSidebar')
}

// 处理登录按钮点击
const handleLogin = () => {
  console.log('点击登录按钮')
  emit('login')
}

// 监听登录状态变化
watch(() => props.isLoggedIn, (newIsLoggedIn) => {
  if (newIsLoggedIn && props.url) {
    // 如果用户登录，且有URL，初始化播放器
    console.log('用户已登录，初始化播放器')
    initPlayer(props.url)
  }
})
</script>

<template>
  <div
      class="video-player"
      @mousemove="showControls"
      @mouseleave="hideControls"
      @touchstart="showControls"
  >
    <div ref="artRef" class="video-player-content"></div>

    <!-- 未登录提示层 -->
    <div v-if="!isLoggedIn" class="login-overlay">
      <div class="login-content">
        <p class="login-desc">登录后即可观看完整视频内容</p>
      </div>
    </div>

    <!-- 返回按钮 - 移除动态显示控制 -->
    <div
        v-if="showBackButton"
        class="back-button"
        @click="goBack"
    >
      <el-icon>
        <ArrowLeft/>
      </el-icon>
    </div>

    <!-- 侧边栏切换按钮 - 添加动态显示控制 -->
    <div
        class="sidebar-toggle"
        @click="toggleSidebar"
        :class="{ 'visible': isControlsVisible, 'expanded': showSidebar }"
    >
      <div class="toggle-icon">
        <img v-if="showSidebar" :src='Right' alt="Left"/>
        <img v-else :src="Left" alt="Right"/>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  /* 使用固定高度比例而不是 aspect-ratio 以减少重排 */
  height: 0;
  padding-top: 56.25%; /* 16:9 的高度比例 */
  background-color: #000;
  overflow: hidden;
  /* 使用更轻量级的硬件加速方式 */
  backface-visibility: hidden;
}

.video-player-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 返回按钮样式 */
.back-button {
  position: absolute;
  top: 0;
  left: 0;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 24px;
  z-index: 100;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.9), 0 0 5px rgba(0, 0, 0, 0.7);
}

.back-button:hover {
  color: #dc2626;
}

.back-button:active {
  transform: scale(0.95);
}

/* 侧边栏切换按钮样式 */
.sidebar-toggle {
  position: absolute;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px 0 0 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  z-index: 10;
  transition: all 0.3s ease;
  /* 默认状态 - 隐藏 */
  opacity: 0;
  visibility: hidden;
}

/* 可见状态 */
.sidebar-toggle.visible {
  opacity: 1;
  visibility: visible;
}

.sidebar-toggle:hover {
  background-color: rgba(0, 0, 0, 0.7);
  width: 28px;
}

.sidebar-toggle.expanded {
  right: 0;
}

.toggle-icon {
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 添加下一集按钮样式 */
:deep(.art-control-next-episode) {
  opacity: 0.95;
  transition: all 0.2s ease;
  margin-left: 5px; /* 添加左边距 */
  padding: 5px;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.art-control-next-episode:hover) {
  opacity: 1;
  transform: scale(1.1);
}

:deep(.art-control-next-episode img) {
  width: 20px;
  height: 20px;
  min-width: 20px; /* 确保图标不会被压缩 */
}

.next-episode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* 添加登录提示层样式 */
.login-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(3px);
}

.login-content {
  text-align: center;
  color: white;
  padding: 30px;
  max-width: 80%;
  border-radius: 10px;
  background-color: rgba(0, 0, 0, 0.5);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.login-icon {
  margin: 0 auto 20px;
  width: 60px;
  height: 60px;
  background-color: rgba(220, 38, 38, 0.15);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #dc2626;
}

.login-title {
  font-size: 22px;
  margin: 0 0 12px;
  font-weight: 500;
}

.login-desc {
  font-size: 16px;
  opacity: 0.8;
  margin: 0 0 24px;
}

.login-button {
  background-color: #dc2626;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.login-button:hover {
  background-color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.4);
}

.login-button:active {
  transform: translateY(0);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .login-title {
    font-size: 18px;
  }
  
  .login-desc {
    font-size: 14px;
  }
  
  .login-button {
    padding: 8px 20px;
    font-size: 14px;
  }
}
</style>
