<script setup>
import { defineProps, defineEmits } from 'vue';
import Loading from '@/assets/gif/loading.gif';

const props = defineProps({
  // 推荐视频列表
  videos: {
    type: Array,
    default: () => []
  },
  // 标题
  title: {
    type: String,
    default: '相关推荐'
  },
  // 是否显示标题
  showTitle: {
    type: Boolean,
    default: true
  },
  // 是否显示加载状态
  loading: {
    type: Boolean,
    default: false
  }
});

// 导出Loading图片给模板使用
const loadingGif = Loading;

const emit = defineEmits(['itemClick']);

// 点击视频项
const handleVideoClick = (videoId) => {
  if (!videoId) {
    console.error('无效的视频ID');
    return;
  }
  emit('itemClick', videoId);
};
</script>

<template>
  <div class="recommendations-section">
    <!-- 标题 -->
    <h3 v-if="showTitle" class="section-title">{{ title }}</h3>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <img :src="loadingGif" alt="加载中" class="loading-img">
      <h5>加载中...</h5>
    </div>

    <!-- 推荐列表 -->
    <div v-else class="recommendations-list">
      <div
          v-for="video in videos"
          :key="video.id"
          class="recommendation-item"
          @click="handleVideoClick(video.id)"
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
</template>

<style scoped>
.recommendations-section {
  background-color: white;
  margin-top: 8px;
  padding: 16px;
}

.section-title {
  font-weight: 500;
  margin-bottom: 12px;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 加载动画样式 */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 0;
  min-height: 150px;
}

.loading-img {
  width: 60px;
  height: 80px;
}

.recommendation-item {
  display: flex;
  cursor: pointer;
  transition: opacity 0.2s;
}

.recommendation-item:hover {
  opacity: 0.9;
}

.recommendation-item:active {
  opacity: 0.7;
}

.thumbnail-container {
  width: 112px;
  aspect-ratio: 16 / 9;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recommendation-info {
  margin-left: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.recommendation-title {
  font-size: 14px;
  font-weight: 500;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin: 0 0 4px 0;
}

.recommendation-tags {
  display: flex;
  gap: 4px;
  margin-top: auto;
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
</style> 