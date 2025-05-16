<script setup>
import {ref, onMounted, onUnmounted, watch, shallowRef} from 'vue'
import Artplayer from 'artplayer'
import artplayerPluginDanmuku from 'artplayer-plugin-danmuku'
import {ElMessage} from 'element-plus'
import {ArrowLeft} from '@element-plus/icons-vue'
import {useRouter} from 'vue-router'

import Next from '@/assets/icon/Next.svg'
import Loading from '@/assets/gif/loading.gif'
import Left from '@/assets/icon/left.svg'
import Right from '@/assets/icon/right.svg'
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
// 播放器实例 - 使用shallowRef以避免响应式深度监听，提高性能
const artInstance = shallowRef(null)
// HLS实例引用
let hlsInstance = null
// 控制返回按钮显示状态
const isControlsVisible = ref(false)
// 控制延迟隐藏的定时器
let hideControlsTimer = null
// 显示加载状态
const isLoading = ref(false)
// 全屏状态
const isFullScreen = ref(false)
// 视频加载错误状态
const videoLoadFailed = ref(false)
// 加载超时计时器
let loadTimeoutTimer = null

// 检测全屏状态变化
const checkFullscreenStatus = () => {
  const fullscreenElement = document.fullscreenElement || 
                            document.webkitFullscreenElement || 
                            document.mozFullScreenElement || 
                            document.msFullscreenElement
  isFullScreen.value = !!fullscreenElement
}

// 显示控制栏
const showControls = () => {
  isControlsVisible.value = true
  checkFullscreenStatus()

  if (hideControlsTimer) {
    clearTimeout(hideControlsTimer)
  }

  hideControlsTimer = setTimeout(() => {
    isControlsVisible.value = false
  }, 3000)
}

// 隐藏控制栏
const hideControls = () => {
  if (hideControlsTimer) {
    clearTimeout(hideControlsTimer)
  }
  hideControlsTimer = setTimeout(() => {
    isControlsVisible.value = false
  }, 800)
}

// 返回上一页
const goBack = () => {
  router.push('/')
}

// 节流函数
function throttle(fn, delay) {
  let lastCall = 0
  return function (...args) {
    const now = new Date().getTime()
    if (now - lastCall < delay) return
    lastCall = now
    return fn(...args)
  }
}

// 处理下一集按钮点击事件
const handleNextEpisode = () => {
  emit('next')
  if (typeof props.onNextEpisode === 'function') {
    props.onNextEpisode()
  }
}

// 初始化播放器后，添加视频事件监听
const setupEventListeners = (art) => {
  // 视频结束事件
  art.on('video:ended', () => {
    emit('ended')
  })

  // 播放/暂停事件
  art.on('play', () => emit('play'))
  art.on('pause', () => emit('pause'))
  
  // 时间更新事件，用节流函数减少存储操作频率
  art.on('video:timeupdate', throttle(() => {
    const currentTime = art.currentTime
    if (props.videoId) {
      localStorage.setItem(`video_progress_${props.videoId}`, currentTime.toString())
    }
    emit('timeupdate', currentTime)
  }, 5000))
  
  // 加载状态监听
  art.on('loading', () => {
    isLoading.value = true
  })
  
  art.on('loaded', () => {
    isLoading.value = false
  })
}

// 初始化播放器
const initPlayer = (url) => {
  if (!url) {
    ElMessage.error('播放地址无效')
    emit('error', new Error('播放地址无效'))
    return
  }

  // 重置错误状态
  videoLoadFailed.value = false
  
  // 设置加载状态
  isLoading.value = true
  
  // 设置加载超时计时器，如果10秒后视频仍在加载，则显示错误
  if (loadTimeoutTimer) {
    clearTimeout(loadTimeoutTimer)
  }
  loadTimeoutTimer = setTimeout(() => {
    if (isLoading.value) {
      videoLoadFailed.value = true
      isLoading.value = false
    }
  }, 10000) // 10秒后判断是否仍在加载

  // 如果用户未登录，不初始化播放器
  if (!props.isLoggedIn) {
    if (artRef.value) {
      artRef.value.innerHTML = ''
    }
    isLoading.value = false
    if (loadTimeoutTimer) {
      clearTimeout(loadTimeoutTimer)
      loadTimeoutTimer = null
    }
    return null
  }

  // 清理旧实例
  if (artInstance.value) {
    try {
      // 销毁旧的HLS实例
      if (hlsInstance) {
        hlsInstance.destroy()
        hlsInstance = null
      }
      artInstance.value.destroy()
    } catch (e) {
      console.error('销毁旧播放器实例失败:', e)
    }
  }

  try {
    // 清空容器
    if (artRef.value) {
      artRef.value.innerHTML = ''
    }

    // 弹幕插件配置
    const danmukuOptions = {
      danmuku: props.danmaku || [],
      speed: 5,
      fontSize: 25,
      color: '#FFFFFF',
      mode: 0,
      margin: [10, 100],
      antiOverlap: true,
      useWorker: true,
      synchronousPlayback: true,
      lockTime: 5,
      maxLength: 100,
      minWidth: 200,
      maxWidth: 400,
      theme: '#DC2626'
    }

    // 播放器配置 - 精简设置项提高性能
    const options = {
      container: artRef.value,
      url,
      poster: props.poster,
      title: props.title,
      volume: 0.7,
      autoplay: props.autoplay,
      pip: true,
      autoSize: false,
      autoMini: false,
      screenshot: false, // 禁用截图功能以减少资源消耗
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: false,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      theme: '#dc2626',
      lang: 'zh-cn',
      plugins: [
        artplayerPluginDanmuku(danmukuOptions)
      ],
      // 直接使用Loading图片作为加载动画
      icons: {
        loading: `<img src="${Loading}" alt="加载中" class="art-player-loading">`,
      },
      controls: [
        {
          position: 'left',
          index: 20,
          name: 'next-episode',
          tooltip: '下一集',
          html: '<div class="next-episode-btn"><img src="' + Next + '" alt="下一集" style="width: 20px; height: 18px;"></div>',
          click: handleNextEpisode,
        },
      ],
      moreVideoAttr: {
        crossOrigin: 'anonymous',
        preload: 'auto', // 改为auto提前加载视频数据
        'webkit-playsinline': true,
        playsinline: true,
      },
      customType: {
        // m3u8格式支持
        m3u8: function (video, url) {
          try {
            if (window.Hls && window.Hls.isSupported()) {
              // 创建新的HLS实例
              hlsInstance = new window.Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: false,
                progressive: true, // 开启渐进式加载，提高加载速度
                startLevel: -1, // 自动选择最佳质量
                abrEwmaDefaultEstimate: 1000000, // 默认带宽估计 500kbps
                // 缓冲区优化
                maxBufferLength: 30, // 减小缓冲区长度，从60秒降至30秒
                maxMaxBufferLength: 60, // 减小最大缓冲区长度，从120秒降至60秒
                // 加载优化
                fragLoadingTimeOut: 10000, // 片段加载超时时间10秒
                manifestLoadingTimeOut: 8000, // 清单加载超时时间8秒
                levelLoadingTimeOut: 8000, // 级别加载超时时间8秒
                // 网络错误恢复设置
                maxRetryCount: 3, // 降低重试次数，加快失败恢复
                // XHR请求配置
                xhrSetup: function (xhr) {
                  xhr.withCredentials = false
                  xhr.setRequestHeader('Accept', '*/*')
                  xhr.setRequestHeader('Origin', window.location.origin)
                  xhr.setRequestHeader('Cache-Control', 'no-cache')
                }
              })

              // 监听加载事件
              hlsInstance.on(window.Hls.Events.MANIFEST_LOADING, () => {
                isLoading.value = true
              })

              // 监听片段加载事件
              hlsInstance.on(window.Hls.Events.FRAG_LOADED, () => {
                isLoading.value = false
              })

              // 错误处理
              hlsInstance.on(window.Hls.Events.ERROR, (_, data) => {
                if (data.fatal) {
                  switch (data.type) {
                    case window.Hls.ErrorTypes.NETWORK_ERROR:
                      hlsInstance.startLoad()
                      break
                    case window.Hls.ErrorTypes.MEDIA_ERROR:
                      hlsInstance.recoverMediaError()
                      break
                    default:
                      try {
                        hlsInstance.destroy()
                        hlsInstance = null
                      } catch (e) {}
                      if (video) {
                        video.dispatchEvent(new Event('error'))
                      }
                      // 设置视频加载失败状态
                      videoLoadFailed.value = true
                      isLoading.value = false
                      break
                  }
                }
              })

              // 清单解析成功事件
              hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, (_, data) => {
                // 预加载策略
                hlsInstance.startLoad(-1)
                if (props.autoplay) {
                  video.play().catch(() => {})
                }
              })

              // 加载视频
              try {
                hlsInstance.loadSource(url)
                hlsInstance.attachMedia(video)
                artInstance.value.$hls = hlsInstance

                // 监听可以播放事件
                video.addEventListener('canplay', () => {
                  isLoading.value = false
                  // 清除加载超时计时器
                  if (loadTimeoutTimer) {
                    clearTimeout(loadTimeoutTimer)
                    loadTimeoutTimer = null
                  }
                })
              } catch (e) {
                isLoading.value = false
                console.error('HLS加载失败:', e)
              }
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
              // Safari浏览器原生支持HLS
              video.src = url
              
              // 添加加载事件监听
              video.addEventListener('loadstart', () => {
                isLoading.value = true
              })
              
              video.addEventListener('canplay', () => {
                isLoading.value = false
              })
              
              if (props.autoplay) {
                video.addEventListener('loadedmetadata', () => {
                  video.play().catch(() => {})
                })
              }
            } else {
              // 浏览器不支持HLS
              ElMessage.error('您的浏览器不支持此视频格式，请使用Chrome或Edge浏览器')
              isLoading.value = false
              if (video) {
                video.dispatchEvent(new Event('error'))
              }
            }
          } catch (error) {
            console.error('HLS初始化失败:', error)
            isLoading.value = false
            if (video) {
              video.dispatchEvent(new Event('error'))
            }
          }
        }
      }
    }

    // 创建播放器实例
    artInstance.value = new Artplayer(options)
    
    // 设置事件监听器
    setupEventListeners(artInstance.value)
    
    // 恢复播放进度
    if (props.videoId) {
      const savedTime = localStorage.getItem(`video_progress_${props.videoId}`)
      if (savedTime) {
        const timeToSeek = parseFloat(savedTime)
        if (!isNaN(timeToSeek) && timeToSeek > 0) {
          // 立即设置时间点，不等待
          artInstance.value.seek = timeToSeek
        }
      }
    }
    
    // 添加视频元素事件监听
    if (artInstance.value.$video) {
      // 监听加载事件
      artInstance.value.$video.onloadstart = () => {
        isLoading.value = true
      }
      
      artInstance.value.$video.oncanplay = () => {
        isLoading.value = false
      }
      
      // 监听错误事件
      artInstance.value.$video.onerror = function() {
        isLoading.value = false
        videoLoadFailed.value = true
        // 清除加载超时计时器
        if (loadTimeoutTimer) {
          clearTimeout(loadTimeoutTimer)
          loadTimeoutTimer = null
        }
        emit('error', this.error || new Error('视频加载失败'))
      }
    }

    return artInstance.value
  } catch (error) {
    console.error('播放器初始化失败:', error)
    isLoading.value = false
    videoLoadFailed.value = true
    // 清除加载超时计时器
    if (loadTimeoutTimer) {
      clearTimeout(loadTimeoutTimer)
      loadTimeoutTimer = null
    }
    emit('error', error)
    return null
  }
}

// 监听URL变化，重新初始化播放器
watch(() => props.url, (newUrl, oldUrl) => {
  // 如果新旧URL不同且之前有URL，需要先清理当前播放的视频
  if (oldUrl && oldUrl !== newUrl && artInstance.value) {
    try {
      // 清空视频源
      if (artInstance.value.$video) {
        artInstance.value.$video.src = ''
        artInstance.value.$video.load()
      }
    } catch (e) {
      console.error('清理视频资源失败:', e)
    }
  }
  
  // 初始化新的播放器
  if (newUrl) {
    initPlayer(newUrl)
  }
}, { flush: 'post' }) // 使用post选项确保DOM更新后再初始化播放器

// 组件挂载时初始化播放器
onMounted(() => {
  if (props.url) {
    initPlayer(props.url)
  }

  // 监听全屏事件
  document.addEventListener('fullscreenchange', checkFullscreenStatus)
  document.addEventListener('webkitfullscreenchange', checkFullscreenStatus)
})

// 组件卸载时销毁播放器和清理资源
onUnmounted(() => {
  // 销毁HLS实例
  if (hlsInstance) {
    try {
      hlsInstance.destroy()
    } catch (e) {}
    hlsInstance = null
  }
  
  // 销毁播放器
  if (artInstance.value) {
    try {
      artInstance.value.destroy()
    } catch (e) {}
    artInstance.value = null
  }

  // 清理定时器
  if (hideControlsTimer) {
    clearTimeout(hideControlsTimer)
    hideControlsTimer = null
  }
  
  // 清理加载超时计时器
  if (loadTimeoutTimer) {
    clearTimeout(loadTimeoutTimer)
    loadTimeoutTimer = null
  }

  // 移除全屏事件监听
  document.removeEventListener('fullscreenchange', checkFullscreenStatus)
  document.removeEventListener('webkitfullscreenchange', checkFullscreenStatus)
})

// 暴露方法给父组件
defineExpose({
  getPlayer: () => artInstance.value,
  play: () => artInstance.value?.play(),
  pause: () => artInstance.value?.pause(),
  toggle: () => artInstance.value?.toggle(),
  seek: (time) => {
    if (artInstance.value) {
      artInstance.value.seek = time
    }
  },
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
  emit('login')
}

// 监听登录状态变化
watch(() => props.isLoggedIn, (newIsLoggedIn) => {
  if (newIsLoggedIn && props.url) {
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
    
    <!-- 视频加载失败提示层 -->
    <div v-if="videoLoadFailed" class="login-overlay">
      <div class="login-content">
        <p class="login-desc">视频加载失败，请检查网络或稍后重试</p>
      </div>
    </div>

    <!-- 返回按钮 -->
    <div
        v-if="showBackButton"
        class="back-button"
        :class="{ 'fullscreen-visible': isFullScreen }"
        @click="goBack"
    >
      <el-icon class="back-icon">
        <ArrowLeft/>
      </el-icon>
      <span class="back-title">{{ title }}</span>
    </div>

    <!-- 侧边栏切换按钮 -->
    <div
        class="sidebar-toggle"
        @click="toggleSidebar"
        :class="{ 'visible': isControlsVisible, 'expanded': showSidebar, 'fullscreen-hidden': isFullScreen }"
    >
      <div class="toggle-icon">
        <img v-if="showSidebar" :src='Right' alt="收起" />
        <img v-else :src="Left" alt="展开" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-player {
  position: relative;
  width: 100%;
  height: 0;
  padding-top: 56.25%; /* 16:9比例 */
  background-color: #000;
  overflow: hidden;
  /* 硬件加速 */
  transform: translateZ(0);
  will-change: transform;
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
  top: 0px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  cursor: pointer;
  color: white;
  z-index: 101;
  max-width: 75%;
}

.back-icon {
  flex-shrink: 0;
  font-size: 20px;
  margin-right: 8px;
}

.back-title {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

/* 全屏模式下的返回按钮样式 */
.back-button.fullscreen-visible {
  top: env(safe-area-inset-top, 0);
  left: env(safe-area-inset-left, 0);
}

/* 全屏模式下隐藏侧边栏按钮 */
.sidebar-toggle.fullscreen-hidden {
  display: none;
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
  margin-left: 5px;
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
  min-width: 20px;
}

.next-episode-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* 登录提示层样式 */
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
}

.login-desc {
  font-size: 16px;
  opacity: 0.8;
  margin: 0 0 24px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .back-button {
    top: 0;
    left: 0;
    max-width: 65%;
  }
  
  .back-button.fullscreen-visible {
    top: env(safe-area-inset-top, 0);
    left: env(safe-area-inset-left, 0);
  }

  .back-title {
    font-size: 13px;
  }
  
  .sidebar-toggle {
    display: none;
  }
}

/* 自定义ArtPlayer的加载图标样式 */
:deep(.art-player-loading) {
  width: 60px;
  height: 80px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 删除不再需要的自定义加载动画样式 */
:deep(.custom-loading-animation),
:deep(.loading-spinner) {
  display: none;
}
</style>
