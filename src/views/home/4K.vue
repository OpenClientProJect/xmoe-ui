<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDramaListService } from '@/api/Drama.js'
import { handleImageUrl, handleImageError } from '@/utils/imageUtils.js'
import Loading from '@/assets/gif/loading.gif'
const route = useRoute()
const router = useRouter()

// 状态变量
const movieList = ref([])
const isLoading = ref(false)
const isEmpty = ref(false)
const activeTab = ref('4K')

// 排序选项
const sortOptions = [
  { label: '时间', value: 'updateTime' },
  { label: '播放', value: 'hot' },
  { label: '评分', value: 'score' }
]

// 当前选中的排序方式
const selectedSort = ref('时间')  // 排序（默认按时间）

// 处理图片加载完成事件
const handleImageLoaded = (event) => {
  event.target.classList.add('loaded')
  // 移除loading类
  event.target.classList.remove('loading')
}

// 处理图片加载开始事件
const handleImageLoading = (event) => {
  // 添加loading类以显示加载动画
  event.target.classList.add('loading')
}

// 获取4K视频列表数据
const get4KList = async (params = {}) => {
  try {
    isLoading.value = true
    isEmpty.value = false
    
    // 合并默认参数和传入的参数
    const queryParams = {
      typeId: params.typeId || 3, // 假设4K视频的typeId为3
      page: 1,
      pageSize: 20,
      ...params
    }
    
    const res = await getDramaListService(queryParams)
    
    if (res.code === 200 && Array.isArray(res.data)) {
      // 处理4K视频数据，确保图片URL正确
      movieList.value = res.data.map(movie => ({
        ...movie,
        // 使用handleImageUrl处理图片URL防盗链问题
        processedCover: handleImageUrl(movie.cover || movie.vod_pic)
      }))
      isEmpty.value = res.data.length === 0
    } else {
      console.error('获取4K视频列表失败:', res.message || '未知错误')
      isEmpty.value = true
    }
  } catch (error) {
    console.error('获取4K视频列表错误:', error)
    isEmpty.value = true
  } finally {
    isLoading.value = false
  }
}

// 处理标签切换
const handleTabChange = (tab) => {
  activeTab.value = tab
  // 向父组件(HomeLayout)发送tab-change事件
  emit('tab-change', tab)
}

// 定义emit
const emit = defineEmits(['tab-change'])

// 监听路由参数变化，重新获取数据
watch(() => route.query.typeId, (newTypeId) => {
  get4KList({ typeId: newTypeId || 3 }) // 如果没有typeId参数，使用默认值3
}, { immediate: true })

// 获取排序参数值
const getSortValue = (sortLabel) => {
  const option = sortOptions.find(opt => opt.label === sortLabel)
  return option ? option.value : 'updateTime'
}

// 选择排序方式
const selectSort = (sortLabel) => {
  selectedSort.value = sortLabel
  
  // 构建查询参数
  const params = {
    type: getSortValue(sortLabel)
  }
  
  // 调用API重新获取数据
  get4KList(params)
}

onMounted(() => {
  // 组件挂载时获取数据
  if (!route.query.typeId) {
    get4KList({ typeId: 3 }) // 默认使用4K视频的typeId
  }
  
  // 向父组件发送tab-change事件
  emit('tab-change', '4K')
  
  // 为浏览器添加resize事件监听器，优化图片加载
  window.addEventListener('resize', optimizeImageLoading)
  
  return () => {
    // 清理事件监听器
    window.removeEventListener('resize', optimizeImageLoading)
  }
})

// 优化图片加载
const optimizeImageLoading = () => {
  // 使用nextTick确保DOM已更新
  nextTick(() => {
    // 使用Intersection Observer API检测可见元素，优先加载可见图片
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const lazyImage = entry.target
            if (lazyImage.classList.contains('anime-img') && !lazyImage.classList.contains('loaded')) {
              // 图片进入视口后开始加载
              lazyImage.classList.add('loading')
              
              // 已经监测到，可以取消观察
              lazyImageObserver.unobserve(lazyImage)
            }
          }
        })
      })
      
      // 找到所有图片并添加监测
      document.querySelectorAll('.anime-img').forEach(img => {
        lazyImageObserver.observe(img)
      })
    }
  })
}

// 监听movieList变化，当数据加载完成后初始化懒加载
watch(() => movieList.value, (newVal) => {
  if (newVal.length > 0) {
    // 数据加载完成，初始化懒加载
    optimizeImageLoading()
  }
})
</script>

<template>
  <div class="movie-content">
    <!-- 排序选项 -->
    <div class="sort-container">
      <div class="sort-scroll-container">
        <div 
          v-for="option in sortOptions" 
          :key="option.label"
          class="sort-item"
          :class="{'sort-active': selectedSort === option.label}"
          @click="selectSort(option.label)"
        >
          {{ option.label }}
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <img :src="Loading" alt="加载中" class="loading-img">
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="isEmpty" class="empty-container">
      <p>暂无4K内容</p>
    </div>
    
    <!-- 4K视频列表 -->
    <div v-else class="anime-list">
      <div 
        v-for="(movie, index) in movieList" 
        :key="movie.id || movie.vod_id"
        class="anime-card"
        :style="`animation-delay: ${index * 30}ms`"
        @click="router.push(`/video/${movie.id || movie.vod_id}`)"
      >
        <div class="anime-cover">
          <img 
            :src="movie.processedCover" 
            :alt="movie.title || movie.vod_name" 
            class="anime-img" 
            @error="handleImageError" 
            @load="handleImageLoaded"
            loading="lazy"
          />
          <div class="image-loading-overlay"></div>
          <span class="anime-episodes">{{ movie.vod_remarks || '' }}</span>
          <span class="quality-badge">4K</span>
        </div>
        <div class="anime-title-container">
          <div class="anime-title">{{ movie.title || movie.vod_name }}</div>
          <div class="anime-sub" v-if="movie.score || movie.vod_score">{{ movie.score || movie.vod_score }}分</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 视频内容区域 */
.movie-content {
  padding: 0 0 80px;
  margin-top: 0; 
}

/* 排序选项容器 */
.sort-container {
  background-color: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 60px; /* 根据您的导航栏高度调整 */
  z-index: 10;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* 排序选项滚动容器 */
.sort-scroll-container {
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  padding: 8px 16px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏滚动条 */
.sort-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 排序选项 */
.sort-item {
  padding: 6px 20px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  border-radius: 20px;
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap;
  flex: 0 0 auto;
  border: 1px solid #eee;
}

.sort-item:hover {
  color: var(--el-text-color-primary);
  background-color: #f9f9f9;
}

.sort-active {
  color: var(--el-color-white);
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  font-weight: 500;
}

.sort-active:hover {
  opacity: 0.9;
}

/* 视频列表 */
.anime-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 10px;
  min-height: 300px; /* 最小高度，防止闪烁 */
}

@media screen and (min-width: 540px) {
  .anime-list {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (min-width: 720px) {
  .anime-list {
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
    padding: 12px;
  }
}

@media screen and (min-width: 960px) {
  .anime-list {
    grid-template-columns: repeat(6, 1fr);
  }
}

.anime-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20px);
  height: 100%; /* 确保卡片高度统一 */
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anime-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.anime-card:hover .anime-img {
  transform: scale(1.05);
}

.anime-cover {
  position: relative;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 3/4; /* 修改为竖向海报比例 */
  background-color: #f0f0f0;
}

.anime-img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持图片比例，裁剪超出部分 */
  object-position: center; /* 居中显示图片 */
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: 0;
}

.anime-img.loaded {
  opacity: 1;
}

.anime-img.loading {
  opacity: 0;
}

/* 添加统一的高度控制 */
.anime-title-container {
  padding: 4px 3px;
  display: flex;
  flex-direction: column;
  background-color: white;
}

.anime-title {
  font-size: 12px;
  font-weight: 400;
  margin-top: 4px;
  text-align: center;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  color: #333;
}

.anime-sub {
  font-size: 10px;
  color: #666;
  text-align: center;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

/* 图片加载中的样式 */
.image-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(240, 240, 240, 0.3) 0%,
    rgba(240, 240, 240, 0.5) 50%,
    rgba(240, 240, 240, 0.3) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  pointer-events: none;
  opacity: 1;
}

.anime-img.loaded + .image-loading-overlay {
  opacity: 0;
}

/* 图片加载错误的样式 */
.anime-img.image-error {
  opacity: 0.8;
  filter: grayscale(0.5);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.anime-episodes {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  color: white;
  padding: 5px;
  font-size: 10px;
  text-align: center;
}

/* 4K质量标签 */
.quality-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background-color: #f59e0b;
  color: white;
  font-size: 10px;
  font-weight: bold;
  padding: 1px 4px;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 加载中状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-img {
  width: 60px;
  height: 80px;
  margin-bottom: 10px;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #666;
  font-size: 14px;
}
</style> 