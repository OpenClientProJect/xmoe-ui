<script setup>
import {ref, onMounted, onUnmounted} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {getDramaDetailService, getRelatedDramaService, getVideoUrlService} from '@/api/Drama.js'
import {ChatDotRound, ArrowDown, ArrowUp, Share} from "@element-plus/icons-vue"
import {ElMessage} from 'element-plus'
import {handleImageUrl} from '@/utils/imageUtils'
//icon
import Collection from '@/assets/icon/collection.svg'
import Ringtones from '@/assets/icon/ringtones.svg'
// 导入顶部导航栏组件
import HeaderNav from '@/components/home/common/HeaderNav.vue'
// 导入播放器组件
import VideoPlayer from '@/components/player/VideoPlayer.vue'
// 导入相关推荐组件
import RelatedRecommend from '@/components/common/RelatedRecommend.vue'
import {getCommentsService} from "@/api/comments.js";

const router = useRouter()
const route = useRoute()

// 顶部导航栏选中的标签
const headerActiveTab = ref('番剧') // 默认选中番剧标签


// 获取视频ID，同时支持路由参数和查询参数
const videoId = route.params.id || route.query.id
const playerRef = ref(null) // 播放器组件引用
const currentVideoUrl = ref('') // 当前播放的视频URL
const currentEpisode = ref(null)
const currentSource = ref(0) // 当前线路，默认为第一个
const episodes = ref([]) // 当前线路的剧集列表
const allEpisodes = ref({}) // 存储所有线路的剧集数据
const relatedVideos = ref([])// 相关视频列表
const isRelatedLoading = ref(false) // 相关推荐加载状态
// 视频信息
const videoInfo = ref({
  id: videoId,
  title: '',
  typeId: '',
  vodArea: '',
  vodClass: '',
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
//评论数据
const comments = ref({
  count: 0,
  lists: []
})

const activeTab = ref('简介')
const tabs = [
  {name: '简介'},
  {name: '评论(0)'}
]

// 格式化时间戳为可读日期
const formatDate = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 控制简介内容的显示/隐藏
const showFullDescription = ref(false)
const toggleDescription = () => {
  showFullDescription.value = !showFullDescription.value
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

// 处理播放器返回按钮事件
const handlePlayerBack = () => {
  console.log('播放器返回按钮点击');
  router.push('/'); // 返回首页
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

// 复制当前页面链接
const copyCurrentUrl = () => {
  // 获取当前页面的完整URL
  const currentUrl = window.location.href

  // 检查是否支持Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // 使用Clipboard API复制到剪贴板
    navigator.clipboard.writeText(currentUrl)
        .then(() => {
          // 复制成功提示
          ElMessage.success('链接已复制到剪贴板')
        })
        .catch(err => {
          // 复制失败提示
          console.error('复制失败:', err)
          fallbackCopyTextToClipboard(currentUrl)
        })
  } else {
    // 使用备用方案
    fallbackCopyTextToClipboard(currentUrl)
  }
}

// 备用复制方案
const fallbackCopyTextToClipboard = (text) => {
  try {
    // 创建一个临时文本区域
    const textArea = document.createElement('textarea')
    textArea.value = text

    // 避免滚动到视图中
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.width = '2em'
    textArea.style.height = '2em'
    textArea.style.padding = '0'
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.boxShadow = 'none'
    textArea.style.background = 'transparent'

    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    // 执行复制命令
    const successful = document.execCommand('copy')
    if (successful) {
      ElMessage.success('链接已复制到剪贴板')
    } else {
      ElMessage.error('复制失败，请手动复制')
    }

    // 清理
    document.body.removeChild(textArea)
  } catch (err) {
    console.error('复制失败:', err)
    ElMessage.error('复制失败，请手动复制')
  }
}

// 跳转到视频详情页
const goToVideoDetail = (id) => {
  if (!id) {
    console.error('无效的视频ID')
    return
  }

  // 如果是当前视频，不需要跳转
  if (id.toString() === videoId.toString()) {
    console.log('当前已经是该视频，无需跳转')
    return
  }

  console.log('跳转到视频详情页,ID:', id)

  // 清空当前状态
  currentEpisode.value = null
  currentVideoUrl.value = ''
  episodes.value = []
  allEpisodes.value = {}
  relatedVideos.value = []

  // 跳转到新的视频详情页，使用正确的路由格式
  router.push(`/video/${id}`)

  // 重新加载数据
  setTimeout(() => {
    getVideoDetail()
    getRelatedDrama()
  }, 100)
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


      // 更新视频信息
      videoInfo.value = {
        id: data.vod_id,
        title: data.vod_name,
        typeId: data.type_id,
        vodArea: data.vod_area,
        vodClass: data.vod_class,
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
          
          // 自动播放第一集视频
          if (episodes.value && episodes.value.length > 0) {
            console.log('自动播放第一集视频')
            playVideo(episodes.value[0].id)
          }
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
    isRelatedLoading.value = true;
    
    const res = await getRelatedDramaService(videoInfo.value.typeId)

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
  } catch (error) {
    console.error('获取相关推荐失败:', error);
  } finally {
    isRelatedLoading.value = false;
  }
}

/**
 * 获取评论数据
 */
const getComments = async () => {
    const res = await getCommentsService(videoId)
      comments.value = res.data
      // 更新评论数量显示
      tabs[1].name = `评论(${comments.value.count || 0})`
}

onMounted(async () => {
  console.log('组件挂载，开始获取数据')
  await getVideoDetail()
  console.log('视频详情加载完成，开始获取相关推荐')
  
  await getRelatedDrama()
  console.log('开始获取评论数据')
  await getComments()
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
          :show-back-button="true"
          @error="handlePlayerError"
          @play="handlePlayerPlay"
          @pause="handlePlayerPause"
          @ended="handlePlayerEnded"
          @timeupdate="handlePlayerTimeUpdate"
          @back="handlePlayerBack"
      />

      <!-- 视频信息 -->
      <div class="video-info">
        <h1 class="video-title">{{ videoInfo.title }}</h1>
        <div class="video-stats">
          <span class="stat-item">{{ videoInfo.views }}次观看</span>
          <span>{{ videoInfo.vodArea }}/</span>
          <span>{{ videoInfo.releaseDate }}/</span>
          <span>{{ videoInfo.vodClass }}</span>
        </div>
      </div>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-btn" @click="toggleCollect">
          <el-icon size="22">
            <img :src="Collection" alt="">
          </el-icon>
          <span class="action-text">追番</span>
        </div>
        <div class="action-btn" @click="toggleSubscribe">
          <el-icon size="22">
            <img :src="Ringtones" alt="">
          </el-icon>
          <span class="action-text">催更</span>
        </div>
        <div class="action-btn" @click="copyCurrentUrl">
          <el-icon size="22">
            <Share/>
          </el-icon>
          <span class="action-text">分享</span>
        </div>
      </div>
    </div>

    <!-- 剧集列表 - 移至内容区域外，放在内容区域上方 -->
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

    <!-- 内容区域 -->
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

          <div class="description-container">
            <p class="description"
               v-html="videoInfo.description"
               :class="{'collapsed': !showFullDescription}"></p>
            <div class="show-more" @click="toggleDescription">
              {{ showFullDescription ? '收起' : '显示更多' }}
              <el-icon v-if="showFullDescription">
                <ArrowUp/>
              </el-icon>
              <el-icon v-else>
                <ArrowDown/>
              </el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 评论内容 -->
      <div v-else class="comment-container">
        <!-- 评论列表 -->
        <div v-if="comments.lists && comments.lists.length > 0" class="comment-list">
          <div v-for="comment in comments.lists"
               :key="comment.comment_id"
               class="comment-item">
            <div class="comment-avatar">
              <img :src="comment.user_pic" alt="用户头像">
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <div class="comment-author">{{ comment.comment_name }}</div>
                <div class="comment-date">{{ formatDate(comment.comment_time) }}</div>
              </div>
              <div class="comment-text">{{ comment.comment_content }}</div>
              <div class="comment-actions">
<!--                <div class="action-btn">-->
<!--                  <el-icon size="14"><ArrowUp /></el-icon>-->
<!--                  <span>{{ comment.comment_up || 0 }}</span>-->
<!--                </div>-->
<!--                <div class="action-btn">-->
<!--                  <el-icon size="14"><ArrowDown /></el-icon>-->
<!--                  <span>{{ comment.comment_down || 0 }}</span>-->
<!--                </div>-->
                <div class="action-btn reply-btn">
                  <el-icon size="14"><ChatDotRound /></el-icon>
                  <span>回复</span>
                </div>
              </div>
              
              <!-- 回复列表 -->
              <div v-if="comment.rp_lists && comment.rp_lists.length > 0" class="reply-list">
                <div v-for="reply in comment.rp_lists" 
                     :key="reply.comment_id"
                     class="reply-item">
                  <div class="reply-avatar">
                    <img :src="reply.user_pic" alt="用户头像">
                  </div>
                  <div class="reply-content">
                    <div class="reply-header">
                      <div class="reply-author">{{ reply.comment_name }}</div>
                      <div class="reply-date">{{ formatDate(reply.comment_time) }}</div>
                    </div>
                    <div class="reply-text">
                      <span v-if="reply.comment_name2" class="reply-to">@{{ reply.comment_name2 }}：</span>
                      {{ reply.comment_content }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 无评论时显示 -->
        <div v-else class="comment-placeholder">
          <el-icon :size="32" class="mb-2">
            <ChatDotRound/>
          </el-icon>
          <p class="text-sm">暂无评论，快来发表第一条评论吧！</p>
        </div>
      </div>
    </div>

    <!-- 相关推荐组件 -->
    <RelatedRecommend 
      :videos="relatedVideos" 
      :title="'相关推荐'" 
      :loading="isRelatedLoading"
      @itemClick="goToVideoDetail" 
    />
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
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:active {
  transform: scale(0.95);
  opacity: 0.8;
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
  /* 修改上边距，与剧集列表保持距离 */
  margin-top: 8px;
  border-radius: 4px;
}

/* 标签页 */
.tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  padding: 0 16px; /* 添加左右间距，与内容区域保持一致 */
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
  padding: 12px 16px; /* 添加左右间距，上下保持12px */
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

.description-container {
  position: relative;
  margin-bottom: 4px;
}

.description {
  font-size: 14px;
  color: #4b5563;
  white-space: pre-line;
  margin: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.description.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 限制显示三行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.show-more {
  color: #dc2626;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
  margin-top: 4px;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 1) 20%);
}

.show-more i {
  margin-left: 4px;
  font-size: 12px;
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

.comment-container {
  padding: 12px 16px;
  margin: 0 auto;
  max-width: 100%;
  background-color: white;
  border-radius: 4px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0 4px;
}

.comment-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
}

.comment-avatar img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-author {
  font-weight: 500;
  font-size: 14px;
  color: #374151;
}

.comment-date {
  font-size: 12px;
  color: #9ca3af;
}

.comment-text {
  font-size: 14px;
  color: #4b5563;
  margin-bottom: 8px;
  line-height: 1.5;
}

.comment-actions {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
}

.action-btn:hover {
  color: #dc2626;
}

.reply-btn {
  margin-left: auto;
}

.reply-list {
  margin-top: 12px;
  padding-left: 12px;
  border-left: 2px solid #e5e7eb;
}

.reply-item {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.reply-avatar img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.reply-content {
  flex: 1;
}

.reply-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}

.reply-author {
  font-weight: 500;
  font-size: 13px;
  color: #374151;
}

.reply-date {
  font-size: 12px;
  color: #9ca3af;
}

.reply-text {
  font-size: 13px;
  color: #4b5563;
}

.reply-to {
  color: #2563eb;
}

.comment-placeholder {
  padding: 24px 0;
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
  border-radius: 4px;
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

/* 顶部导航栏样式 */
.header-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}

/* 评论区域响应式样式 */
@media (min-width: 768px) {
  .comment-container {
    padding: 16px 24px;
    max-width: 90%;
  }
}

@media (max-width: 767px) {
  .comment-container {
    padding: 12px 16px;
  }
}

/* 平板和桌面设备上优化网格显示 */
@media (min-width: 768px) {
  .episodes-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

/* 大屏设备上优化网格显示 */
@media (min-width: 1024px) {
  .episodes-grid {
    grid-template-columns: repeat(8, 1fr);
  }
}
</style>