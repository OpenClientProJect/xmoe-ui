<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDramaListService } from '@/api/Drama.js'

const route = useRoute()
const router = useRouter()

// 状态变量
const movieList = ref([])
const isLoading = ref(false)
const isEmpty = ref(false)
const activeTab = ref('剧场版')

// 获取剧场版列表数据
const getMovieList = async (typeId = 2) => {
  try {
    isLoading.value = true
    isEmpty.value = false
    
    const res = await getDramaListService({
      typeId: typeId, // 默认使用剧场版的typeId
      page: 1,
      pageSize: 20
    })
    
    if (res.code === 200 && Array.isArray(res.data)) {
      movieList.value = res.data
      isEmpty.value = res.data.length === 0
    } else {
      console.error('获取剧场版列表失败:', res.message || '未知错误')
      isEmpty.value = true
    }
  } catch (error) {
    console.error('获取剧场版列表错误:', error)
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
  getMovieList(newTypeId || 2) // 如果没有typeId参数，使用默认值2
}, { immediate: true })

onMounted(() => {
  // 组件挂载时获取数据
  if (!route.query.typeId) {
    getMovieList(2) // 默认使用剧场版的typeId
  }
})
</script>

<template>
  <div class="movie-page">
    <!-- 内容区域 -->
    <div class="movie-content">
      <!-- 加载中状态 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <div class="loading-text">加载中...</div>
      </div>
      
      <!-- 空状态 -->
      <div v-else-if="isEmpty" class="empty-container">
        <div class="empty-text">暂无剧场版内容</div>
      </div>
      
      <!-- 剧场版列表 -->
      <div v-else class="movie-grid">
        <div 
          v-for="movie in movieList" 
          :key="movie.id"
          class="movie-item"
          @click="router.push(`/video/${movie.id}`)"
        >
          <div class="movie-cover">
            <img :src="movie.cover" :alt="movie.title" class="cover-img" />
          </div>
          <div class="movie-info">
            <div class="movie-title">{{ movie.title }}</div>
            <div class="movie-meta">
              <span class="movie-year">{{ movie.year }}</span>
              <span v-if="movie.score" class="movie-score">{{ movie.score }}分</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </div>
</template>

<style scoped>
.movie-page {
  min-height: 100vh;
  background-color: #f5f5f5;
}

/* 当有子菜单时，增加内容区域的上边距 */
:deep(.sub-menu-container) ~ .movie-content {
  padding-top: 40px;
}

.movie-content {
  padding: 16px;
}

/* 剧场版网格布局 */
.movie-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.movie-item {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
  cursor: pointer;
}

.movie-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.movie-cover {
  position: relative;
  width: 100%;
  padding-top: 56.25%; /* 16:9 宽高比 */
  overflow: hidden;
}

.cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.movie-info {
  padding: 12px;
}

.movie-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.movie-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
}

.movie-year {
  color: #888;
}

.movie-score {
  color: #ff6b8b;
  font-weight: 500;
}

/* 加载中状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #ff6b8b;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-text {
  color: #666;
  font-size: 14px;
}

/* 空状态 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.empty-text {
  color: #999;
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .movie-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 12px;
  }
  
  .movie-info {
    padding: 8px;
  }
  
  .movie-title {
    font-size: 13px;
  }
}
</style>