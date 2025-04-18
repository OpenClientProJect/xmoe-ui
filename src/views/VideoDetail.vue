<script setup>
import {ref, onMounted, onUnmounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {getDramaDetailService, getRelatedDramaService, getVideoUrlService} from '@/api/Drama.js'
import {StarFilled, Collection, Share, ChatDotRound, ArrowDown} from "@element-plus/icons-vue"
import {ElMessage} from 'element-plus'
import {handleImageUrl} from '@/utils/imageUtils'
// 导入顶部导航栏组件
import HeaderNav from '@/components/home/common/HeaderNav.vue'
// 导入播放器组件
import VideoPlayer from '@/components/player/VideoPlayer.vue'
const router = useRouter()
const route = useRoute()

// 顶部导航栏选中的标签
const headerActiveTab = ref('番剧') // 默认选中番剧标签


const videoId = route.params.id
const playerRef = ref(null) // 播放器组件引用
const currentVideoUrl = ref('') // 当前播放的视频URL
const currentEpisode = ref(null)
const currentSource = ref(0) // 当前线路，默认为第一个
const episodes = ref([]) // 当前线路的剧集列表
const allEpisodes = ref({}) // 存储所有线路的剧集数据
const relatedVideos = ref([])// 相关视频列表
// 视频信息
const videoInfo = ref({
  id: videoId,
  title: '',
  typeId: '',
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



const activeTab = ref('简介')
const tabs = [
  {name: '简介'},
  {name: '评论(128)'}
]


const toggleLike = () => {
  videoInfo.value.isLiked = !videoInfo.value.isLiked
}

const toggleCollect = () => {
  videoInfo.value.isCollected = !videoInfo.value.isCollected
}

const toggleSubscribe = () => {
  videoInfo.value.isSubscribed = !videoInfo.value.isSubscribed
}

// 处理顶部导航栏标签切换
const handleHeaderTabChange = (tab) => {
  headerActiveTab.value = tab

  // 根据标签跳转到相应页面
  switch (tab) {
    case '推荐':
      router.push('/')
      break
    case '番剧':
      // 当前已经在番剧页面，不需要跳转
      break
    case '剧场版':
      router.push('/movie')
      break
    case '4K':
      router.push('/4k')
      break
    default:
      break
  }
}

// 处理播放器事件
const handlePlayerError = (error) => {
  console.error('播放器错误:', error)
  ElMessage.error('视频播放失败，请尝试其他线路')
}

const handlePlayerPlay = () => {
  console.log('开始播放')
}

const handlePlayerPause = () => {
  console.log('暂停播放')
}

const handlePlayerEnded = () => {
  console.log('播放结束')
  // 可以在这里添加自动播放下一集的逻辑
}

const handlePlayerTimeUpdate = (currentTime) => {
  // 可以在这里处理播放进度更新
}

// 播放视频
const playVideo = async (episodeId) => {
  const episode = episodes.value.find(ep => ep.id === episodeId)
  if (!episode) {
    console.error('找不到剧集信息')
    ElMessage.error('无效的剧集信息')
    return
  }

  if (!episode.sourceId) {
    console.error('剧集缺少播放源ID')
    ElMessage.error('无效的视频源')
    return
  }

  currentEpisode.value = episode
  console.log('当前选择的剧集:', episode)
  console.log('原始视频源ID:', episode.sourceId)

  // 标记当前集为已观看
  episode.watched = true

  try {
    // 调用API获取视频地址
    const res = await getVideoUrlService(videoInfo.value.id, episode.sourceId)

    if (res.code === 200 && res.data) {
      console.log('获取到视频地址:', res.data)

      // 处理视频URL，确保可以正确播放
      let videoUrl = ''

      // 检查res.data的类型并提取URL
      if (typeof res.data === 'string') {
        videoUrl = res.data
      } else if (typeof res.data === 'object') {
        if (res.data.url) {
          videoUrl = res.data.url
        } else {
          console.log('响应数据对象:', res.data)
          for (const key in res.data) {
            if (typeof res.data[key] === 'string' &&
                (res.data[key].includes('http') ||
                 res.data[key].includes('.mp4') ||
                 res.data[key].includes('.m3u8'))) {
              videoUrl = res.data[key]
              break
            }
          }
        }
      }

      if (!videoUrl) {
        throw new Error('无法从响应中提取视频地址')
      }

      console.log('提取到的原始视频地址:', videoUrl)

      // 处理跨域问题，使用代理URL
      let proxyUrl = videoUrl

      // 判断是否是外部URL
      if (videoUrl.startsWith('http') && !videoUrl.startsWith(window.location.origin)) {
        try {
          const urlObj = new URL(videoUrl)

          // 如果是xmoe.video域名，使用video-proxy代理
          if (urlObj.hostname === 'xmoe.video') {
            proxyUrl = `/video-proxy${urlObj.pathname}${urlObj.search}`
            console.log('使用代理URL:', proxyUrl)
          }
        } catch (e) {
          console.error('解析URL失败:', e)
        }
      }

      // 更新当前播放的视频URL
      currentVideoUrl.value = proxyUrl

      return proxyUrl
    } else {
      ElMessage.error(res.message || '获取视频地址失败')
    }
  } catch (error) {
    ElMessage.error('获取视频地址失败: ' + (error.message || '未知错误'))
  }
  return null
}


// 切换线路
const switchSource = (sourceId) => {
  currentSource.value = sourceId

  // 加载对应线路的剧集数据
  if (allEpisodes.value[sourceId]) {
    episodes.value = allEpisodes.value[sourceId]
    console.log('切换到线路', sourceId, '剧集数:', episodes.value.length)

  } else {
    ElMessage.warning('该线路暂无剧集数据')
    episodes.value = []
  }
}

// 改进tab切换
const setActiveTab = (tab) => {
  activeTab.value = tab
}

// 组件卸载时清理资源
onUnmounted(() => {
  // 播放器组件会自动处理资源清理
  console.log('组件卸载，清理资源')
})

// 获取视频详情
const getVideoDetail = async () => {
  try {
    console.log('获取视频详情，ID:', videoId)
    const res = await getDramaDetailService(videoId)

    if (res.code === 200 && res.data) {
      const data = res.data

      // 打印原始数据便于调试
      console.log('原始视频数据:', data)

      // 打印原始数据中的typeId
      // console.log('原始数据中的typeId:', data.type_id,
      //             '类型:', typeof data.type_id,
      //             '其他可能的typeId字段:',
      //             'type_id_1:', data.type_id_1,
      //             'vod_type_id:', data.vod_type_id)
      //
      // // 确保有效的typeId
      // const typeId = data.type_id || data.vod_type_id || '1'
      // console.log('最终使用的typeId:', typeId)

      // 更新视频信息
      videoInfo.value = {
        id: data.vod_id,
        title: data.vod_name,
        typeId: data.type_id, // 使用处理后的typeId
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
        isLiked: false,
        isCollected: false,
        isSubscribed: true
      }
      console.log('设置后的videoInfo.typeId:', videoInfo.value.typeId)
      // 存储不同线路的剧集数据
      allEpisodes.value = {}

      // 如果有播放地址，处理剧集信息
      if (data.vod_play_url) {
        // 处理所有线路的剧集数据
        const playUrls = data.vod_play_url.split('$$$')

        // 处理线路信息
        const sourcesInfo = playUrls.map((source, index) => {
          const lines = ['官方', '主线', '备用']
          const name = index < lines.length ? lines[index] : `线路${index + 1}`

          // 统计该线路的剧集数
          const episodeCount = source.split('#').filter(ep => ep.includes('$')).length

          // 处理该线路的剧集列表
          const episodesData = source.split('#').map((item, epIndex) => {
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

            return {
              id: epIndex + 1,
              title: title,
              sourceId: id, // 保存原始ID用于请求
              watched: false,
              duration: '24:00'
            };
          }).filter(item => item && item.sourceId); // 过滤掉无效和没有sourceId的项

          // 存储该线路的剧集数据
          if (episodesData.length > 0) {
            allEpisodes.value[index] = episodesData;
          }

          return {
            id: index,
            name: name,
            count: episodeCount
          }
        }).filter(item => item.count > 0) // 过滤掉没有剧集的线路

        videoInfo.value.sources = sourcesInfo
        console.log('线路信息:', sourcesInfo)

        // 更新剧集列表
        if (sourcesInfo.length > 0) {
          // 默认使用第一个线路
          currentSource.value = 0;
          episodes.value = allEpisodes.value[0] || [];
          console.log('当前线路剧集:', episodes.value);
        }
      }
    } else {
      ElMessage.warning(res.message || '获取视频信息失败')
    }
  } catch (error) {
    console.error('获取视频详情失败:', error)
  }
}
//相关推荐
const getRelatedDrama = async () => {
  try {

    const res = await getRelatedDramaService(videoInfo.value.typeId)

    if (res.code === 200) {
      // 根据响应数据结构进行适配
      let relatedData = [];

      if (Array.isArray(res.data)) {
        // 新的响应格式，直接是数组
        relatedData = res.data;
        console.log('获取到相关推荐(新格式):', relatedData);
      } else if (res.data && res.data.list) {
        // 旧的响应格式，有list属性
        relatedData = res.data.list;
        console.log('获取到相关推荐(旧格式):', relatedData);
      }

      if (relatedData.length > 0) {
        // 处理相关推荐数据
        relatedVideos.value = relatedData.map(item => ({
          id: item.vod_id,
          title: item.vod_name,
          cover: handleImageUrl(item.vod_pic),
          views: item.vod_hits || '0',
          episode: item.vod_remarks || '',
          score: item.vod_score || '0',
          tags: item.vod_class ? item.vod_class.split(',') : []
        }));

        console.log('处理后的相关推荐:', relatedVideos.value);
      } else {
        console.warn('相关推荐数据为空');
      }
    } else {
      console.warn('获取相关推荐失败:', res.message || '未知错误');
    }
  } catch (error) {
    console.error('获取相关推荐失败:', error);
  }
}

onMounted(async () => {
    console.log('组件挂载，开始获取数据')
    await getVideoDetail()
    console.log('视频详情加载完成，开始获取相关推荐')
    await getRelatedDrama()
})
</script>

<template>
  <div class="video-detail-container">
    <!-- 顶部导航栏 -->
    <div class="header-container">
      <HeaderNav
        :tabs="['推荐', '番剧', '剧场版', '4K']"
        :active-tab="headerActiveTab"
        @tab-change="handleHeaderTabChange"
      />
    </div>
    <!-- 视频播放器区域 -->
    <div class="player-container">
      <!-- 使用新的播放器组件 -->
      <VideoPlayer
        ref="playerRef"
        :url="currentVideoUrl"
        :title="currentEpisode?.title || videoInfo.title"
        :poster="videoInfo.cover"
        :video-id="videoId"
        @error="handlePlayerError"
        @play="handlePlayerPlay"
        @pause="handlePlayerPause"
        @ended="handlePlayerEnded"
        @timeupdate="handlePlayerTimeUpdate"
      />

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
          <span class="action-text">{{ videoInfo.likes }}</span>
        </div>
        <div class="action-btn" @click="toggleCollect">
          <el-icon size="22">
            <StarFilled/>
          </el-icon>
          <span class="action-text">收藏</span>
        </div>
        <div class="action-btn" @click="toggleSubscribe">
          <el-icon size="22">
            <Collection/>
          </el-icon>
          <span class="action-text">追番</span>
        </div>
        <div class="action-btn">
          <el-icon size="22">
            <Share/>
          </el-icon>
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
        <el-icon :size="32" class="mb-2">
          <ChatDotRound/>
        </el-icon>
        <p class="text-sm">评论功能开发中...</p>
      </div>
    </div>

    <!-- 剧集列表 -->
    <div class="episodes-section">
      <div class="episodes-header">
        <h3 class="section-title">剧集</h3>
        <div class="episode-count">
          共{{ episodes.length }}集，{{ videoInfo.episode }}
          <el-icon>
            <ArrowDown/>
          </el-icon>
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

      <div v-if="relatedVideos.length === 0" class="no-recommendations">
        加载推荐中...
      </div>

      <div v-else class="recommendations-list">
        <div
            v-for="video in relatedVideos"
            :key="video.id"
            class="recommendation-item"
            @click="goToVideoDetail(video.id)"
        >
          <div class="thumbnail-container">
            <img :src="video.cover" class="thumbnail" alt=""/>
            <div class="episode-badge" v-if="video.episode">
              {{ video.episode }}
            </div>
          </div>
          <div class="recommendation-info">
            <h4 class="recommendation-title">{{ video.title }}</h4>
            <div class="recommendation-tags" v-if="video.tags && video.tags.length">
              <span class="recommendation-tag" v-for="(tag, index) in video.tags.slice(0, 2)" :key="index">
                {{ tag }}
              </span>
            </div>
            <div class="recommendation-stats">
              <span class="views">{{ video.views }}播放</span>
              <span class="score" v-if="video.score && video.score !== '0'">
                <i class="el-icon-star-on"></i> {{ video.score }}
              </span>
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

/* 视频播放器区域 - 随页面滚动 */
.player-container {
  width: 100%;
  background-color: white;
  /* 使用更高效的阴影实现 */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-top: 90px; /* 为顶部导航栏留出空间 */
  /* 添加硬件加速 */
  transform: translateZ(0);
  will-change: transform;
  z-index: 2;
}

.video-player {
  position: relative;
  width: 100%;
  /* 使用固定高度比例而不是 aspect-ratio 以减少重排 */
  height: 0;
  padding-top: 56.25%; /* 16:9 的高度比例 */
  background-color: #000;
  /* 添加硬件加速 */
  transform: translateZ(0);
  will-change: transform;
  overflow: hidden;
}

/* 添加一个内容容器来定位播放器 */
.video-player-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
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

/* 内容区域 */
.content-container {
  background-color: white;
  /* 添加硬件加速 */
  transform: translateZ(0);
  will-change: transform;
  z-index: 1;
  /* 添加上边距，避免与播放器重叠 */
  margin-top: 16px;
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
  position: relative;
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

.recommendation-tags {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.recommendation-tag {
  font-size: 10px;
  padding: 1px 4px;
  background-color: #f3f4f6;
  border-radius: 2px;
  color: #6b7280;
}

.recommendation-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.recommendation-stats .views {
  color: #6b7280;
}

.recommendation-stats .score {
  color: #f59e0b;
  font-weight: 500;
}

.episode-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
}

.no-recommendations {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}

.no-episodes {
  text-align: center;
  padding: 20px;
  color: #6b7280;
}

/* 顶部导航栏样式 */
.header-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}


</style>