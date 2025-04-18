<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Artplayer from 'artplayer'
import { ElMessage } from 'element-plus'

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
  }
})

// 定义事件
const emit = defineEmits(['play', 'pause', 'ended', 'timeupdate', 'error'])

// 播放器容器引用
const artRef = ref(null)
// 播放器实例
const artInstance = ref(null)
// 创建ResizeObserver来处理缩放事件
let resizeObserver = null
let resizeTimeout = null

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

// 初始化播放器
const initPlayer = (url) => {
  if (!url) {
    console.error('播放URL为空')
    ElMessage.error('播放地址无效')
    return
  }

  // 如果已经有播放器实例，先销毁
  if (artInstance.value) {
    artInstance.value.destroy()
  }

  try {
    console.log('初始化播放器，URL:', url)

    // 清空容器
    artRef.value.innerHTML = ''

    // 添加调试信息
    console.log('创建播放器容器:', {
      artRefWidth: artRef.value.offsetWidth,
      artRefHeight: artRef.value.offsetHeight
    })

    // 播放器配置 - 优化性能
    const options = {
      container: artRef.value,
      url: url,
      poster: props.poster,
      title: props.title,
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: props.autoplay,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: false, // 禁用截图功能以提高性能
      setting: true,
      loop: false,
      flip: false, // 禁用翻转功能以提高性能
      playbackRate: true,
      aspectRatio: false, // 禁用宽高比调整以提高性能
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: false, // 禁用字幕偏移以提高性能
      miniProgressBar: true,
      mutex: true,
      backdrop: false, // 禁用背景模糊以提高性能
      playsInline: true,
      autoPlayback: true,
      airplay: false, // 禁用需要额外资源的功能
      theme: '#dc2626',
      lang: 'zh-cn',
      moreVideoAttr: {
        crossOrigin: 'anonymous',
        preload: 'metadata', // 只预加载元数据以提高性能
        'webkit-playsinline': true,
        playsinline: true,
      },
      customType: {
        // 添加对m3u8格式的支持
        m3u8: function(video, url) {
          if (window.Hls && window.Hls.isSupported()) {
            const hls = new window.Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: false,
              maxBufferLength: 60,
              maxMaxBufferLength: 120,
              maxBufferSize: 20 * 1000 * 1000, // 20MB
              maxRetryCount: 5,
              // 设置XHR请求配置
              xhrSetup: function(xhr, url) {
                // 不发送凭证，避免CORS预检请求
                xhr.withCredentials = false
                // 设置请求头
                xhr.setRequestHeader('Accept', '*/*')
                xhr.setRequestHeader('Origin', window.location.origin)
                console.log('HLS请求:', url)
              }
            })
            
            // 添加错误处理
            hls.on(window.Hls.Events.ERROR, function(event, data) {
              console.error('HLS错误:', data)
              if (data.fatal) {
                switch(data.type) {
                  case window.Hls.ErrorTypes.NETWORK_ERROR:
                    console.log('HLS网络错误，尝试恢复')
                    hls.startLoad()
                    break
                  case window.Hls.ErrorTypes.MEDIA_ERROR:
                    console.log('HLS媒体错误，尝试恢复')
                    hls.recoverMediaError()
                    break
                  default:
                    console.error('无法恢复的HLS错误:', data)
                    ElMessage.error('视频加载失败，请尝试其他线路')
                    break
                }
              }
            })
            
            // 添加成功事件
            hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
              console.log('HLS清单解析完成，开始播放')
              video.play().catch(e => {
                console.error('自动播放失败:', e)
              })
            })
            
            hls.loadSource(url)
            hls.attachMedia(video)

            // 保存hls实例以便后续清理
            artInstance.value.$hls = hls
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // 对于Safari等原生支持HLS的浏览器
            video.src = url
            video.addEventListener('loadedmetadata', function() {
              video.play().catch(e => {
                console.error('自动播放失败:', e)
              })
            })
          } else {
            console.warn('当前浏览器不支持HLS播放')
            ElMessage.error('您的浏览器不支持此视频格式，请使用Chrome或Edge浏览器')
          }
        }
      }
    }

    // 创建播放器实例
    artInstance.value = new Artplayer(options)

    // 最小化播放器事件监听，只保留必要的事件
    artInstance.value.on('error', (error) => {
      console.error('播放器错误:', error)
      emit('error', error)
    })

    // 播放事件
    artInstance.value.on('play', () => {
      emit('play')
    })

    // 暂停事件
    artInstance.value.on('pause', () => {
      emit('pause')
    })

    // 结束事件
    artInstance.value.on('ended', () => {
      emit('ended')
    })
    
    // 添加缓存控制，使用节流函数减少回调频率
    artInstance.value.on('video:timeupdate', throttle(() => {
      // 保存播放进度
      const currentTime = artInstance.value.currentTime
      if (props.videoId) {
        localStorage.setItem(`video_progress_${props.videoId}`, currentTime.toString())
      }
      emit('timeupdate', currentTime)
    }, 5000)) // 5秒内只执行一次，减少存储操作

    // 尝试恢复播放进度
    if (props.videoId) {
      const savedTime = localStorage.getItem(`video_progress_${props.videoId}`)
      if (savedTime) {
        const time = parseFloat(savedTime)
        if (!isNaN(time) && time > 0) {
          // 等待播放器准备好后设置时间
          artInstance.value.on('ready', () => {
            setTimeout(() => {
              artInstance.value.seek = time
              console.log('恢复播放进度:', time)
            }, 500)
          })
        }
      }
    }

    return artInstance.value
  } catch (error) {
    console.error('初始化播放器失败:', error)
    emit('error', error)
    return null
  }
}

// 监听URL变化，重新初始化播放器
watch(() => props.url, (newUrl) => {
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
  if (window.ResizeObserver) {
    resizeObserver = new ResizeObserver(throttle(entries => {
      // 使用节流函数减少回调频率
      // 在缩放结束后才调整播放器
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (artInstance.value && artRef.value) {
          // 通知播放器调整大小
          artInstance.value.resize()
        }
      }, 200)
    }, 200))
    
    // 监听播放器容器的大小变化
    if (artRef.value) {
      resizeObserver.observe(artRef.value)
    }
  }
})

// 组件卸载时销毁播放器和清理资源
onUnmounted(() => {
  // 销毁播放器
  if (artInstance.value) {
    artInstance.value.destroy()
    artInstance.value = null
  }
  
  // 清理ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  
  // 清理定时器
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
    resizeTimeout = null
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
</script>

<template>
  <div class="video-player">
    <div ref="artRef" class="video-player-content"></div>
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
</style>
