<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getDramaDetailService } from '@/api/Drama.js'
import { VideoPlay , StarFilled, Collection, Share, ChatDotRound, ArrowDown } from "@element-plus/icons-vue"
import Artplayer from 'artplayer'
import Hls from 'hls.js'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const videoId = route.params.id
const artRef = ref(null)
const artInstance = ref(null)
const currentEpisode = ref(null)

// 视频信息
const videoInfo = ref({
  id: videoId,
  title: '',
  cover: '',
  episode: '',
  views: '',
  likes: '',
  releaseDate: '',
  description: '',
  tags: [],
  isLiked: false,
  isCollected: false,
  isSubscribed: true
})

// 获取视频详情
const getVideoDetail = async () => {
  try {
    const res = await getDramaDetailService(videoId)
    if (res.data) {
      const data = res.data
      
      // 打印原始数据便于调试
      console.log('原始视频数据:', data)
      
      // 处理剧集数据 - 修复URL处理逻辑
      const episodesData = data.vod_play_url.split(',').map((item, index) => {
        // 查找https://的位置
        const httpsIndex = item.indexOf('https://')
        let title = '第' + (index + 1) + '集'
        let url = ''
        
        if (httpsIndex !== -1) {
          // 提取标题和URL
          title = item.substring(0, httpsIndex)
          
          // 直接使用代理路径
          // 根据示例："第01集https://cloud.xmoe.app/01"，我们需要提取出"/01"
          const fullUrl = item.substring(httpsIndex)
          const pathIndex = fullUrl.lastIndexOf('/')
          
          if (pathIndex !== -1) {
            const path = fullUrl.substring(pathIndex) // 提取出"/01"
            url = '/cloud' + path // 变成"/cloud/01"
          }
        }
        
        return {
          id: index + 1,
          title: title || `第${index + 1}集`,
          url: url,
          watched: false,
          duration: '24:00'
        }
      })
      
      console.log('处理后的剧集数据:', episodesData)
      
      // 更新视频信息
      videoInfo.value = {
        id: data.vod_id,
        title: data.vod_name,
        cover: data.vod_pic,
        episode: data.vod_remarks,
        views: '0',
        likes: '0',
        releaseDate: '',
        description: data.vod_blurb,
        tags: data.vod_actor ? data.vod_actor.split(' / ') : [],
        isLiked: false,
        isCollected: false,
        isSubscribed: true
      }
      
      // 更新剧集列表
      episodes.value = episodesData
      
      // 默认播放第一集
      if (episodesData.length > 0) {
        playVideo(episodesData[0].id)
      }
    }
  } catch (error) {
    console.error('获取视频详情失败:', error)
  }
}

const episodes = ref([
  { id: 1, title: '第1集', duration: '24:30', watched: true },
  { id: 2, title: '第2集', duration: '24:15', watched: true },
  { id: 3, title: '第3集', duration: '24:45', watched: true },
  { id: 4, title: '第4集', duration: '24:10', watched: true },
  { id: 5, title: '第5集', duration: '24:35', watched: true },
  { id: 6, title: '第6集', duration: '24:20', watched: true },
  { id: 7, title: '第7集', duration: '24:40', watched: true },
  { id: 8, title: '第8集', duration: '24:25', watched: true },
  { id: 9, title: '第9集', duration: '24:50', watched: true },
  { id: 10, title: '第10集', duration: '24:30', watched: true },
  { id: 11, title: '第11集', duration: '24:15', watched: false },
  { id: 12, title: '第12集', duration: '24:45', watched: false }
])

// 相关推荐
const relatedVideos = ref([
  { 
    id: 101, 
    title: '间谍过家家 第二季', 
    cover: 'https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2874976551.jpg',
    views: '356万',
    episode: '更新至24集'
  },
  { 
    id: 102, 
    title: '葬送的芙莉莲', 
    cover: 'https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2886492022.jpg',
    views: '289万',
    episode: '更新至25集'
  },
  { 
    id: 103, 
    title: '咒术回战 第二季', 
    cover: 'https://img9.doubanio.com/view/photo/m/public/p2886273597.jpg',
    views: '412万',
    episode: '更新至23集'
  }
])

const activeTab = ref('简介')
const tabs = [
  { name: '简介' },
  { name: '评论(128)' }
]

const goBack = () => {
  router.back()
}

const toggleLike = () => {
  videoInfo.value.isLiked = !videoInfo.value.isLiked
}

const toggleCollect = () => {
  videoInfo.value.isCollected = !videoInfo.value.isCollected
}

const toggleSubscribe = () => {
  videoInfo.value.isSubscribed = !videoInfo.value.isSubscribed
}

// 播放视频
const playVideo = (episodeId) => {
  const episode = episodes.value.find(ep => ep.id === episodeId)
  if (episode && episode.url) {
    currentEpisode.value = episode
    console.log('准备播放URL:', episode.url)
    initPlayer(episode.url)
  } else {
    console.error('无效的剧集或URL不存在')
    handlePlayError('无效的剧集或URL不存在')
  }
}

// 处理播放错误
const handlePlayError = (errorMsg) => {
  ElMessage.error(errorMsg || '视频加载失败，请稍后再试')
}

// 初始化播放器
const initPlayer = (url) => {
  if (!url) {
    console.error('播放URL为空')
    handlePlayError('播放地址无效')
    return
  }

  if (artInstance.value) {
    artInstance.value.destroy()
  }
  
  try {
    console.log('初始化播放器，URL:', url)
    
    artInstance.value = new Artplayer({
      container: artRef.value,
      url: url,
      poster: videoInfo.value.cover,
      title: videoInfo.value.title,
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: false,
      autoMini: true,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#dc2626',
      lang: 'zh-cn',
      moreVideoAttr: {
        crossOrigin: 'anonymous'
      },
      customType: {
        m3u8: function(video, url) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              // 增加HLS配置以提高兼容性
              xhrSetup: function(xhr) {
                xhr.withCredentials = false; // 不发送凭证
              }
            })
            
            hls.loadSource(url)
            hls.attachMedia(video)
            
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
              video.play().catch(e => {
                console.error('自动播放失败:', e)
              })
            })
            
            hls.on(Hls.Events.ERROR, function(event, data) {
              console.error('HLS错误:', data)
              if (data.fatal) {
                handlePlayError('视频流加载失败')
              }
            })
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = url
            video.addEventListener('loadedmetadata', function() {
              video.play().catch(e => {
                console.error('自动播放失败:', e)
              })
            })
            video.addEventListener('error', function(e) {
              console.error('视频加载错误:', e)
              handlePlayError('视频加载失败')
            })
          } else {
            handlePlayError('您的浏览器不支持播放此视频格式')
          }
        }
      }
    })
    
    // 播放器事件监听
    artInstance.value.on('ready', () => {
      console.log('播放器准备就绪')
    })
    
    artInstance.value.on('play', () => {
      console.log('开始播放')
      
      // 标记当前集为已观看
      if (currentEpisode.value) {
        const index = episodes.value.findIndex(ep => ep.id === currentEpisode.value.id)
        if (index !== -1) {
          episodes.value[index].watched = true
        }
      }
    })
    
    artInstance.value.on('pause', () => {
      console.log('暂停播放')
    })
    
    artInstance.value.on('error', (error) => {
      console.error('播放器错误:', error)
      handlePlayError()
    })
    
    artInstance.value.on('destroy', () => {
      console.log('播放器销毁')
    })
  } catch (error) {
    console.error('初始化播放器失败:', error)
    handlePlayError('初始化播放器失败')
  }
}

// 改进tab切换
const setActiveTab = (tab) => {
  activeTab.value = tab
}

// 组件卸载时销毁播放器
onUnmounted(() => {
  if (artInstance.value) {
    artInstance.value.destroy()
  }
})

onMounted(() => {
  console.log('视频ID:', videoId)
  getVideoDetail()
})
</script>

<template>
  <div class="video-detail-container">
    <!-- 视频播放器区域 -->
    <div class="player-container">
      <div ref="artRef" class="video-player"></div>

      <!-- 视频信息 -->
      <div class="video-info">
        <h1 class="video-title">{{ videoInfo.title }}</h1>
        <div class="video-stats">
          <span class="stat-item">{{ videoInfo.views }}次观看</span>
          <span class="stat-item">{{ videoInfo.releaseDate }}</span>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-btn" @click="toggleLike">
          <el-icon size="22"><ThumbUp /></el-icon>
          <span class="action-text">{{ videoInfo.likes }}</span>
        </div>
        <div class="action-btn" @click="toggleCollect">
          <el-icon size="22"><StarFilled /></el-icon>
          <span class="action-text">收藏</span>
        </div>
        <div class="action-btn" @click="toggleSubscribe">
          <el-icon size="22"><Collection /></el-icon>
          <span class="action-text">追番</span>
        </div>
        <div class="action-btn">
          <el-icon size="22"><Share /></el-icon>
          <span class="action-text">分享</span>
        </div>
      </div>
    </div>

    <!-- 内容区域 - 添加足够的上边距 -->
    <div class="content-container">
      <!-- 标签页 -->
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab.name"
          class="tab"
          :class="{'active-tab': activeTab === tab.name}"
          @click="setActiveTab(tab.name)"
        >
          {{ tab.name }}
          <div v-if="activeTab === tab.name" class="tab-indicator"></div>
        </div>
      </div>
      
      <!-- 简介内容 -->
      <div v-if="activeTab === '简介'" class="tab-content">
        <div class="tag-list">
          <span 
            v-for="tag in videoInfo.tags" 
            :key="tag"
            class="tag"
          >
            {{ tag }}
          </span>
        </div>
        
        <p class="description">{{ videoInfo.description }}</p>
        
        <!-- 订阅按钮 -->
        <div class="subscribe-section">
          <div class="channel-info">
            <div class="channel-avatar"></div>
            <span class="channel-name">XMoe动漫</span>
          </div>
          <el-button 
            :type="videoInfo.isSubscribed ? 'default' : 'danger'" 
            size="small" 
            @click="toggleSubscribe"
          >
            {{ videoInfo.isSubscribed ? '已追番' : '+ 追番' }}
          </el-button>
        </div>
      </div>
      
      <!-- 评论内容 -->
      <div v-else class="comment-placeholder">
        <el-icon :size="32" class="mb-2"><ChatDotRound /></el-icon>
        <p class="text-sm">评论功能开发中...</p>
      </div>
    </div>
    
    <!-- 剧集列表 -->
    <div class="episodes-section">
      <div class="episodes-header">
        <h3 class="section-title">剧集</h3>
        <div class="episode-count">
          共{{ episodes.length }}集，{{ videoInfo.episode }} <el-icon><ArrowDown /></el-icon>
        </div>
      </div>
      
      <div v-if="episodes.length === 0" class="no-episodes">
        加载剧集中...
      </div>
      
      <div v-else class="episodes-grid">
        <div 
          v-for="episode in episodes" 
          :key="episode.id"
          class="episode-item"
          :class="{
            'current-episode': currentEpisode && episode.id === currentEpisode.id, 
            'watched-episode': episode.watched
          }"
          @click="playVideo(episode.id)"
        >
          <div class="episode-title">{{ episode.title }}</div>
          <div 
            v-if="episode.watched" 
            class="progress-bar"
          >
            <div class="progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 相关推荐 -->
    <div class="recommendations-section">
      <h3 class="section-title">相关推荐</h3>
      
      <div class="recommendations-list">
        <div 
          v-for="video in relatedVideos" 
          :key="video.id"
          class="recommendation-item"
        >
          <div class="thumbnail-container">
            <img :src="video.cover" class="thumbnail" />
          </div>
          <div class="recommendation-info">
            <h4 class="recommendation-title">{{ video.title }}</h4>
            <div class="recommendation-stats">
              <span>{{ video.views }}播放</span>
              <span>{{ video.episode }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 16px;
}

/* 视频播放器区域 - 固定到顶部 */
.player-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background-color: white;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.video-player {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-button {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 16px;
  border-radius: 50%;
  cursor: pointer;
}

.video-info {
  padding: 12px 16px;
}

.video-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.video-stats {
  display: flex;
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
}

.stat-item {
  margin-right: 12px;
}

.action-bar {
  display: flex;
  justify-content: space-around;
  padding: 8px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.action-text {
  font-size: 12px;
  margin-top: 4px;
  color: #374151;
}

/* 内容区域 - 为固定头部添加足够的上边距 */
.content-container {
  padding-top: calc(56.25vw + 124px); /* 视频播放器高度(16:9比例) + 信息区和操作栏高度 */
  background-color: white;
}

/* 标签页 */
.tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  margin-top: 8px;
}

.tab {
  margin-right: 16px;
  padding: 8px 0;
  position: relative;
  cursor: pointer;
}

.active-tab {
  color: #dc2626;
  font-weight: 500;
}

.tab-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #dc2626;
}

.tab-content {
  padding: 12px 0;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.tag {
  padding: 4px 8px;
  background-color: #f3f4f6;
  border-radius: 999px;
  font-size: 12px;
}

.description {
  font-size: 14px;
  color: #4b5563;
}

.subscribe-section {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.channel-info {
  display: flex;
  align-items: center;
}

.channel-avatar {
  width: 32px;
  height: 32px;
  background-color: #e5e7eb;
  border-radius: 50%;
  margin-right: 8px;
}

.channel-name {
  font-size: 14px;
  font-weight: 500;
}

.comment-placeholder {
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

/* 剧集列表 */
.episodes-section {
  background-color: white;
  margin-top: 8px;
  padding: 16px;
}

.episodes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-title {
  font-weight: 500;
}

.episode-count {
  font-size: 12px;
  color: #6b7280;
}

.episodes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.episode-item {
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  text-align: center;
  position: relative;
  cursor: pointer;
}

.current-episode {
  border-color: #dc2626;
  color: #dc2626;
}

.watched-episode {
  background-color: #f9fafb;
}

.episode-title {
  font-size: 12px;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: #d1d5db;
}

.progress-fill {
  height: 100%;
  background-color: #dc2626;
  width: 100%;
}

/* 推荐列表 */
.recommendations-section {
  background-color: white;
  margin-top: 8px;
  padding: 16px;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.recommendation-item {
  display: flex;
}

.thumbnail-container {
  width: 112px;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
  overflow: hidden;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommendation-info {
  margin-left: 12px;
  flex: 1;
}

.recommendation-title {
  font-size: 14px;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.recommendation-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  margin-top: 8px;
}

.no-episodes {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}
</style>