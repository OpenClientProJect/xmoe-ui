<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const videoId = route.params.id

// 模拟视频数据
const videoInfo = ref({
  id: videoId,
  title: '快藏起来！玛琪娜同学！',
  cover: 'https://placeholder.pics/svg/360x200/FF9CAA/FFFFFF/视频封面',
  episode: '第12集',
  views: '298.6万',
  likes: '12.5万',
  releaseDate: '2024-04-02',
  description: '讲述了女主角玛琪娜和男主角的有趣故事。本集中，玛琪娜在学校的各种逗趣表现让同学们忍俊不禁...',
  tags: ['恋爱', '校园', '喜剧'],
  isLiked: false,
  isCollected: false,
  isSubscribed: true
})

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
    cover: 'https://placeholder.pics/svg/120x80/AACEEF/FFFFFF/封面1',
    views: '356万',
    episode: '更新至24集'
  },
  { 
    id: 102, 
    title: '葬送的芙莉莲', 
    cover: 'https://placeholder.pics/svg/120x80/CEAAFF/FFFFFF/封面2',
    views: '289万',
    episode: '更新至25集'
  },
  { 
    id: 103, 
    title: '咒术回战 第二季', 
    cover: 'https://placeholder.pics/svg/120x80/AAFFAA/555555/封面3',
    views: '412万',
    episode: '更新至23集'
  }
])

const activeTab = ref('简介')
const tabs = ['简介', '评论(128)']

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

const playVideo = (episodeId) => {
  console.log('播放视频', episodeId)
  // 这里应该处理视频播放逻辑
}

onMounted(() => {
  console.log('视频ID:', videoId)
})
</script>

<template>
  <div class="video-detail-container">
    <!-- 视频播放区域 -->
    <div class="video-player-section">
      <div class="video-player">
        <img :src="videoInfo.cover" class="video-cover" alt="video cover" />
        <div class="play-button-overlay">
          <div class="play-button">
            <el-icon :size="32" class="text-white"><el-icon-video-play /></el-icon>
          </div>
        </div>
      </div>
      
      <!-- 返回按钮 -->
      <div class="back-button">
        <div class="back-button-inner" @click="goBack">
          <el-icon class="text-white"><el-icon-arrow-left /></el-icon>
        </div>
      </div>
    </div>
    
    <!-- 视频信息 -->
    <div class="video-info-section">
      <h1 class="video-title">{{ videoInfo.title }} {{ videoInfo.episode }}</h1>
      
      <div class="video-stats">
        <div>{{ videoInfo.views }}播放 · {{ videoInfo.releaseDate }}</div>
        <div>{{ videoInfo.likes }}点赞</div>
      </div>
      
      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="action-item" @click="toggleLike">
          <el-icon :size="24" :class="{'text-red-500': videoInfo.isLiked}">
            <el-icon-thumb v-if="!videoInfo.isLiked" />
            <el-icon-thumb v-else />
          </el-icon>
          <span class="action-label">点赞</span>
        </div>
        
        <div class="action-item" @click="toggleCollect">
          <el-icon :size="24" :class="{'text-yellow-500': videoInfo.isCollected}">
            <el-icon-star v-if="!videoInfo.isCollected" />
            <el-icon-star-filled v-else />
          </el-icon>
          <span class="action-label">收藏</span>
        </div>
        
        <div class="action-item">
          <el-icon :size="24"><el-icon-share /></el-icon>
          <span class="action-label">分享</span>
        </div>
        
        <div class="action-item">
          <el-icon :size="24"><el-icon-download /></el-icon>
          <span class="action-label">缓存</span>
        </div>
      </div>
      
      <!-- 标签页 -->
      <div class="tabs">
        <div 
          v-for="tab in tabs" 
          :key="tab" 
          class="tab"
          :class="{'active-tab': activeTab === tab}"
          @click="activeTab = tab"
        >
          {{ tab }}
          <div v-if="activeTab === tab" class="tab-indicator"></div>
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
        <el-icon :size="32" class="mb-2"><el-icon-chat-dot-round /></el-icon>
        <p class="text-sm">评论功能开发中...</p>
      </div>
    </div>
    
    <!-- 剧集列表 -->
    <div class="episodes-section">
      <div class="episodes-header">
        <h3 class="section-title">剧集</h3>
        <div class="episode-count">
          共12集，更新至12集 <el-icon><el-icon-arrow-down /></el-icon>
        </div>
      </div>
      
      <div class="episodes-grid">
        <div 
          v-for="episode in episodes" 
          :key="episode.id"
          class="episode-item"
          :class="{'current-episode': episode.id === 12, 'watched-episode': episode.watched}"
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
  padding-bottom: 1rem;
  position: relative;
  overflow-x: hidden;
}

/* 视频播放区域 */
.video-player-section {
  position: relative;
  width: 100%;
}

.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: black;
  position: relative;
}

.video-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-button-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-button {
  width: 64px;
  height: 64px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-button {
  position: absolute;
  top: 12px;
  left: 12px;
}

.back-button-inner {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

/* 视频信息区域 */
.video-info-section {
  background-color: white;
  padding: 16px;
}

.video-title {
  font-size: 18px;
  font-weight: 500;
}

.video-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 14px;
  color: #666;
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding: 12px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
}

.action-label {
  font-size: 12px;
  margin-top: 4px;
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
</style>