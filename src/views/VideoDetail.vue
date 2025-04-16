<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { getDramaDetailService, getVideoPlayUrlService } from '@/api/Drama.js'
import { StarFilled, Collection, Share, ChatDotRound, ArrowDown } from "@element-plus/icons-vue"
import Artplayer from 'artplayer'
import Hls from 'hls.js'
import { ElMessage } from 'element-plus'
import { handleImageUrl } from '@/utils/imageUtils'
import { handleVideoUrl } from '@/utils/videoUtils'

const router = useRouter()
const route = useRoute()
const videoId = route.params.id
const artRef = ref(null)
const artInstance = ref(null)
const currentEpisode = ref(null)
const currentSource = ref(0) // 当前线路，默认为第一个

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
  sources: [],
  isLiked: false,
  isCollected: false,
  isSubscribed: true
})

// 存储不同线路的剧集数据
const allEpisodes = ref({})

// 切换线路
const switchSource = (sourceId) => {
  currentSource.value = sourceId
  
  // 加载对应线路的剧集数据
  if (allEpisodes.value[sourceId]) {
    episodes.value = allEpisodes.value[sourceId]
    
    // 如果当前线路有剧集，自动播放第一集
    if (episodes.value.length > 0) {
      playVideo(episodes.value[0].id)
    } else {
      ElMessage.warning('该线路暂无可播放剧集')
    }
  } else {
    // 如果没有该线路的数据，重新获取视频详情
    getVideoDetail(sourceId)
  }
}

// 获取视频详情
const getVideoDetail = async (sourceId = 0) => {
  try {
    const res = await getDramaDetailService(videoId)
    if (res.code === 200 && res.data) {
      const data = res.data
      
      // 打印原始数据便于调试
      console.log('原始视频数据:', data)
      
      // 处理所有线路的剧集数据
      const playUrls = data.vod_play_url.split('$$$')
      
      // 处理线路信息
      const sourcesInfo = playUrls.map((source, index) => {
        const lines = ['官方', '主线', '备用']
        const name = index < lines.length ? lines[index] : `线路${index + 1}`
        
        // 统计该线路的剧集数
        const episodeCount = source.split('#').filter(ep => ep.includes('$')).length
        
        return {
          id: index,
          name: name,
          count: episodeCount
        }
      }).filter(item => item.count > 0) // 过滤掉没有剧集的线路
      
      console.log('线路信息:', sourcesInfo)
      
      // 更新视频信息
      videoInfo.value = {
        id: data.vod_id,
        title: data.vod_name,
        cover: handleImageUrl(data.vod_pic),
        episode: data.vod_remarks,
        views: data.vod_hits || '0',
        likes: data.vod_up || '0',
        releaseDate: data.vod_pubdate || data.vod_year || '',
        description: data.vod_content || data.vod_blurb || '',
        tags: data.vod_class ? data.vod_class.split(',') : [],
        actors: data.vod_actor ? data.vod_actor.split(' / ') : [],
        area: data.vod_area || '',
        year: data.vod_year || '',
        weekday: data.vod_weekday || '',
        sources: sourcesInfo,
        isLiked: false,
        isCollected: false,
        isSubscribed: true
      }
      
      // 预先处理所有线路的剧集数据
      playUrls.forEach((sourceUrl, index) => {
        // 处理剧集列表
        const episodesData = sourceUrl.split('#').map((item, epIndex) => {
          // 排除空项
          if (!item.trim()) {
            return null;
          }
          
          const parts = item.split('$');
          // 确保至少有两部分：标题和ID
          if (parts.length < 2) {
            console.warn('剧集格式不正确:', item);
            return null;
          }
          
          const title = parts[0] || `第${epIndex + 1}集`;
          
          // 如果有多个$分隔符，则合并后面的部分作为ID
          let id = '';
          if (parts.length > 2) {
            id = parts.slice(1).join('$');
          } else {
            id = parts[1] || '';
          }
          
          // 为视频源ID添加额外数据，便于UI显示
          let sourceType = '未知';
          if (id.startsWith('MOE')) {
            sourceType = 'MOE源';
          } else if (id.startsWith('id_MOE')) {
            sourceType = 'MOE源';
          } else if (id.startsWith('id_XS')) {
            sourceType = '备用源';
          }
          
          return {
            id: epIndex + 1,
            title: title,
            sourceId: id, // 保存原始ID用于请求
            sourceType: sourceType,
            watched: false,
            duration: '24:00'
          };
        }).filter(item => item && item.sourceId); // 过滤掉无效和没有sourceId的项
        
        // 存储该线路的剧集数据
        if (episodesData.length > 0) {
          allEpisodes.value[index] = episodesData;
        }
      });
      
      // 使用指定的线路，或者默认使用第一个可用线路
      if (sourcesInfo.length > 0) {
        const targetSource = Math.min(sourceId, sourcesInfo.length - 1)
        currentSource.value = targetSource
        
        // 更新剧集列表
        episodes.value = allEpisodes.value[targetSource] || []
        
        // 默认播放第一集
        if (episodes.value.length > 0) {
          playVideo(episodes.value[0].id)
        } else {
          ElMessage.warning('暂无可播放剧集')
        }
      } else {
        episodes.value = []
        ElMessage.warning('暂无可播放剧集')
      }
    }
  } catch (error) {
    console.error('获取视频详情失败:', error)
    ElMessage.error('获取视频详情失败，请稍后再试')
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
    cover: handleImageUrl('https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2874976551.jpg'),
    views: '356万',
    episode: '更新至24集'
  },
  { 
    id: 102, 
    title: '葬送的芙莉莲', 
    cover: handleImageUrl('https://img3.doubanio.com/view/photo/s_ratio_poster/public/p2886492022.jpg'),
    views: '289万',
    episode: '更新至25集'
  },
  { 
    id: 103, 
    title: '咒术回战 第二季', 
    cover: handleImageUrl('https://img9.doubanio.com/view/photo/m/public/p2886273597.jpg'),
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
const playVideo = async (episodeId) => {
  const episode = episodes.value.find(ep => ep.id === episodeId)
  if (!episode) {
    console.error('找不到剧集信息')
    handlePlayError('无效的剧集信息')
    return
  }
  
  if (!episode.sourceId) {
    console.error('剧集缺少播放源ID')
    handlePlayError('无效的视频源')
    return
  }
  
  currentEpisode.value = episode
  console.log('当前选择的剧集:', episode);
  
  try {
    // 使用新的API服务获取真实播放地址
    const playUrlRes = await getVideoPlayUrlService(episode.sourceId)
    
    if (playUrlRes.code === 200 && playUrlRes.data && playUrlRes.data.url) {
      // 处理视频URL
      const videoUrl = handleVideoUrl(playUrlRes.data.url)
      console.log('获取到实际播放URL:', videoUrl)
      
      // 初始化播放器
      initPlayer(videoUrl)
    } else {
      throw new Error('获取播放地址失败')
    }
  } catch (error) {
    console.error('获取播放地址失败:', error)
    handlePlayError('获取视频播放地址失败，请稍后再试')
  }
}

// 处理播放错误
const handlePlayError = (errorMsg) => {
  ElMessage.error(errorMsg || '视频加载失败，请稍后再试')
  
  // 记录失败
  if (currentEpisode.value) {
    console.error('播放失败的剧集:', currentEpisode.value)
  }
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
    
    // 处理URL格式
    let processedUrl = url;
    let customType = null;
    
    // 根据URL类型选择适当的播放方式
    if (url.includes('.m3u8') || url.includes('playlist') || url.includes('chunklist')) {
      // HLS流
      console.log('检测到HLS流媒体');
      customType = 'm3u8';
    } else if (url.includes('.flv')) {
      // FLV视频
      console.log('检测到FLV视频');
      customType = 'flv';
    } else if (url.startsWith('/cloud/')) {
      // 内部代理地址，默认当作m3u8处理
      console.log('使用内部代理地址');
      customType = 'm3u8';
    }
    
    // 播放器配置
    const options = {
      container: artRef.value,
      url: processedUrl,
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
      customType: {}
    };
    
    // 根据视频类型添加自定义处理器
    if (customType === 'm3u8') {
      options.customType['m3u8'] = function(video, url) {
        if (Hls.isSupported()) {
          const hls = new Hls({
            // 增加HLS配置以提高兼容性
            xhrSetup: function(xhr) {
              xhr.withCredentials = false; // 不发送凭证
              console.log('设置HLS请求:', url);
            },
            maxBufferLength: 60,
            maxMaxBufferLength: 120,
            maxBufferSize: 20 * 1000 * 1000, // 增加缓冲区大小到20MB
            maxBufferHole: 1,
            lowLatencyMode: false
          });
          
          hls.loadSource(url);
          hls.attachMedia(video);
          
          // 添加更多事件监听
          hls.on(Hls.Events.MANIFEST_PARSED, function() {
            console.log('HLS清单解析完成，开始播放');
            video.play().catch(e => {
              console.error('自动播放失败:', e);
            });
          });
          
          hls.on(Hls.Events.LEVEL_LOADED, function() {
            console.log('HLS级别加载完成');
          });
          
          hls.on(Hls.Events.ERROR, function(event, data) {
            console.error('HLS错误:', data);
            if (data.fatal) {
              switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  console.log('HLS网络错误，尝试恢复');
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  console.log('HLS媒体错误，尝试恢复');
                  hls.recoverMediaError();
                  break;
                default:
                  handlePlayError('视频流加载失败: ' + data.details);
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          console.log('使用原生HLS支持播放');
          video.src = url;
          video.addEventListener('loadedmetadata', function() {
            video.play().catch(e => {
              console.error('自动播放失败:', e);
            });
          });
          video.addEventListener('error', function(e) {
            console.error('视频加载错误:', e);
            handlePlayError('视频加载失败');
          });
        } else {
          handlePlayError('您的浏览器不支持播放此视频格式');
        }
      };
    } else if (customType === 'flv') {
      options.customType['flv'] = function(video, url) {
        console.log('使用FLV播放器');
        // 如果需要支持FLV，需要引入flv.js库
        if (window.flvjs && window.flvjs.isSupported()) {
          const flvPlayer = window.flvjs.createPlayer({
            type: 'flv',
            url: url
          });
          flvPlayer.attachMediaElement(video);
          flvPlayer.load();
          flvPlayer.play();
        } else {
          console.error('未检测到FLV.js，无法播放FLV格式');
          handlePlayError('不支持FLV格式播放');
        }
      };
    }
    
    // 创建播放器实例
    artInstance.value = new Artplayer(options);
    
    // 播放器事件监听
    artInstance.value.on('ready', () => {
      console.log('播放器准备就绪');
    });
    
    artInstance.value.on('play', () => {
      console.log('开始播放');
      
      // 标记当前集为已观看
      if (currentEpisode.value) {
        const index = episodes.value.findIndex(ep => ep.id === currentEpisode.value.id);
        if (index !== -1) {
          episodes.value[index].watched = true;
        }
      }
    });
    
    artInstance.value.on('pause', () => {
      console.log('暂停播放');
    });
    
    artInstance.value.on('error', (error) => {
      console.error('播放器错误:', error);
      handlePlayError();
    });
    
    artInstance.value.on('destroy', () => {
      console.log('播放器销毁');
    });
  } catch (error) {
    console.error('初始化播放器失败:', error);
    handlePlayError('初始化播放器失败：' + error.message);
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
        
        <p class="description" v-html="videoInfo.description"></p>
        
        <!-- 视频信息 -->
        <div class="video-meta">
          <div class="meta-item" v-if="videoInfo.area">
            <span class="meta-label">地区：</span>
            <span class="meta-value">{{ videoInfo.area }}</span>
          </div>
          <div class="meta-item" v-if="videoInfo.year">
            <span class="meta-label">年份：</span>
            <span class="meta-value">{{ videoInfo.year }}</span>
          </div>
          <div class="meta-item" v-if="videoInfo.weekday">
            <span class="meta-label">更新时间：</span>
            <span class="meta-value">{{ videoInfo.weekday }}</span>
          </div>
          <div class="meta-item" v-if="videoInfo.actors && videoInfo.actors.length">
            <span class="meta-label">声优：</span>
            <span class="meta-value">{{ videoInfo.actors.join(' / ') }}</span>
          </div>
        </div>
        
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
      
      <!-- 线路选择 -->
      <div v-if="videoInfo.sources && videoInfo.sources.length > 1" class="source-tabs">
        <div 
          v-for="source in videoInfo.sources" 
          :key="source.id"
          class="source-tab"
          :class="{'active-source': currentSource === source.id}"
          @click="switchSource(source.id)"
        >
          {{ source.name }} ({{ source.count }}集)
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
          <div class="episode-source-type" v-if="episode.sourceType">{{ episode.sourceType }}</div>
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
/* 来源标签样式 */
.source-tabs {
  display: flex;
  overflow-x: auto;
  margin-bottom: 12px;
  scrollbar-width: none;
}

.source-tabs::-webkit-scrollbar {
  display: none;
}

.source-tab {
  padding: 6px 12px;
  margin-right: 8px;
  background-color: #f3f4f6;
  border-radius: 16px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}

.active-source {
  background-color: #dc2626;
  color: white;
}

.episode-source-type {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 9px;
  padding: 2px 4px;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 4px;
}

/* 原有样式 */
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
  white-space: pre-line;
}

.video-meta {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  font-size: 13px;
  color: #4b5563;
}

.meta-label {
  color: #6b7280;
  margin-right: 8px;
}

.meta-value {
  color: #374151;
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