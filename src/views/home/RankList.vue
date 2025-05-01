<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getRankListService } from '@/api/home/anime.js'
import { handleImageUrl } from '@/utils/imageUtils.js'

const router = useRouter()

// 默认封面图片
const defaultCover = ref('/images/default-cover.png')

// 排行榜数据
const rankData = ref({
  tv: [],
  movie: [],
  anime: [],
  tj: []
})

// 加载状态
const loading = ref({
  tv: true,
  movie: true,
  anime: true,
  tj: true
})

// 获取排行榜数据
const getRankList = async () => {
  try {
    // 依次获取各个榜单数据
    const categories = [
      { type: 'tv', typeId: 1 }, // 番剧
      { type: 'movie', typeId: 2 }, // 剧场版
      { type: 'anime', typeId: 3 }, // 4K
      { type: 'tj', typeId: 4 } // 待添加
    ]
    
    for (const { type, typeId } of categories) {
      loading.value[type] = true
      try {
        const res = await getRankListService(typeId)
        
        if (res && res.code === 200 && Array.isArray(res.data)) {
          // 处理排行榜数据
          rankData.value[type] = res.data.map((item, index) => ({
            id: item.vod_id,
            rank: index + 1,
            title: item.vod_name,
            score: parseFloat(item.vod_douban_score || '0').toFixed(1) || '暂无评分',
            cover: handleImageUrl(item.vod_pic || ''),
            updateInfo: item.vod_remarks || '暂无更新',
            hot: item.vod_hits || 0,
            year: item.vod_year || ''
          }))
        }
      } catch (error) {
        console.error(`获取${type}排行榜失败:`, error)
      } finally {
        loading.value[type] = false
      }
    }
  } catch (error) {
    console.error('获取排行榜数据失败:', error)
    ElMessage.error('获取排行榜数据失败')
  }
}

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.src = defaultCover.value
}

// 返回首页
const goBack = () => {
  router.push('/')
}

// 跳转到详情页
const goToDetail = (id) => {
  router.push(`/video/${id}`)
}

// 组件挂载时获取数据
onMounted(() => {
  getRankList()
})
</script>

<template>
  <div class="rank-list-container">
    <!-- 热播排行榜单顶部区域 -->
    <div class="banner-area">
      <div class="banner-content">
        <h1 class="banner-title">热播排行榜单</h1>
        <p class="banner-subtitle">周热度排行，每天更新</p>
      </div>
    </div>
    
    <!-- 返回按钮 -->
    <div class="back-button" @click="goBack">
      <el-icon size="20">
        <ArrowLeft />
      </el-icon>
    </div>
    
    <!-- 排行榜内容 -->
    <div class="rank-content">
      <!-- 番剧排行榜 -->
      <div class="rank-section">
        <div class="rank-header">
          <h2 class="rank-title">TV番组</h2>
        </div>
        
        <!-- 加载提示 -->
        <div v-if="loading.tv" class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
        
        <!-- 无数据提示 -->
        <div v-else-if="rankData.tv.length === 0" class="empty-container">
          <div class="empty-text">暂无排行榜数据</div>
        </div>
        
        <!-- 排行榜列表 -->
        <div v-else class="rank-list">
          <div 
            v-for="item in rankData.tv.slice(0, 7)" 
            :key="item.id"
            class="rank-item"
            @click="goToDetail(item.id)"
          >
            <!-- 排名 -->
            <div class="rank-number" :class="item.rank <= 3 ? `rank-${item.rank}` : ''">
              {{ item.rank }}
            </div>
            
            <!-- 封面和信息 -->
            <div class="rank-cover-info">
              <div class="rank-cover">
                <img 
                  :src="item.cover" 
                  :alt="item.title"
                  @error="handleImageError"
                  loading="lazy"
                >
                <div class="update-info">{{ item.updateInfo }}</div>
              </div>
              
              <div class="rank-info">
                <div class="rank-title">{{ item.title }}</div>
                <div class="rank-meta">
                  <span v-if="item.year" class="rank-year">{{ item.year }}</span>
                </div>
              </div>
            </div>
            
            <!-- 热度 -->
            <div class="rank-hot">
              <span class="hot-number">{{ item.hot }}</span>
              <span class="hot-text">本周热度</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 剧场版排行榜 -->
      <div class="rank-section">
        <div class="rank-header">
          <h2 class="rank-title">剧场番组</h2>
        </div>
        
        <!-- 加载提示 -->
        <div v-if="loading.movie" class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
        
        <!-- 无数据提示 -->
        <div v-else-if="rankData.movie.length === 0" class="empty-container">
          <div class="empty-text">暂无排行榜数据</div>
        </div>
        
        <!-- 排行榜列表 -->
        <div v-else class="rank-list">
          <div 
            v-for="item in rankData.movie.slice(0, 7)" 
            :key="item.id"
            class="rank-item"
            @click="goToDetail(item.id)"
          >
            <!-- 排名 -->
            <div class="rank-number" :class="item.rank <= 3 ? `rank-${item.rank}` : ''">
              {{ item.rank }}
            </div>
            
            <!-- 封面和信息 -->
            <div class="rank-cover-info">
              <div class="rank-cover">
                <img 
                  :src="item.cover" 
                  :alt="item.title"
                  @error="handleImageError"
                  loading="lazy"
                >
                <div class="update-info">{{ item.updateInfo }}</div>
              </div>
              
              <div class="rank-info">
                <div class="rank-title">{{ item.title }}</div>
                <div class="rank-meta">
                  <span v-if="item.year" class="rank-year">{{ item.year }}</span>
                </div>
              </div>
            </div>
            
            <!-- 热度 -->
            <div class="rank-hot">
              <span class="hot-number">{{ item.hot }}</span>
              <span class="hot-text">本周热度</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 4K专区排行榜 -->
      <div class="rank-section">
        <div class="rank-header">
          <h2 class="rank-title">4K专区</h2>
        </div>
        
        <!-- 加载提示 -->
        <div v-if="loading.anime" class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
        
        <!-- 无数据提示 -->
        <div v-else-if="rankData.anime.length === 0" class="empty-container">
          <div class="empty-text">暂无排行榜数据</div>
        </div>
        
        <!-- 排行榜列表 -->
        <div v-else class="rank-list">
          <div 
            v-for="item in rankData.anime.slice(0, 7)" 
            :key="item.id"
            class="rank-item"
            @click="goToDetail(item.id)"
          >
            <!-- 排名 -->
            <div class="rank-number" :class="item.rank <= 3 ? `rank-${item.rank}` : ''">
              {{ item.rank }}
            </div>
            
            <!-- 封面和信息 -->
            <div class="rank-cover-info">
              <div class="rank-cover">
                <img 
                  :src="item.cover" 
                  :alt="item.title"
                  @error="handleImageError"
                  loading="lazy"
                >
                <div class="update-info">{{ item.updateInfo }}</div>
              </div>
              
              <div class="rank-info">
                <div class="rank-title">{{ item.title }}</div>
                <div class="rank-meta">
                  <span v-if="item.year" class="rank-year">{{ item.year }}</span>
                </div>
              </div>
            </div>
            
            <!-- 热度 -->
            <div class="rank-hot">
              <span class="hot-number">{{ item.hot }}</span>
              <span class="hot-text">本周热度</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.rank-list-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60px;
  position: relative;
}

/* 顶部横幅区域 */
.banner-area {
  height: 150px;
  background: linear-gradient(135deg, #1a237e, #2c387e, #1a237e);
  background-size: 200% 200%;
  animation: gradientBG 15s ease infinite;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.banner-area::before, .banner-area::after {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
  z-index: 0;
}

.banner-area::before {
  top: -100px;
  right: -50px;
}

.banner-area::after {
  bottom: -150px;
  left: -100px;
}

@keyframes gradientBG {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.banner-content {
  text-align: center;
  color: white;
  position: relative;
  z-index: 1;
}

.banner-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
  position: relative;
  display: inline-block;
}

.banner-subtitle {
  font-size: 14px;
  opacity: 0.8;
}

/* 返回按钮 */
.back-button {
  position: absolute;
  top: 15px;
  left: 15px;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;
  z-index: 2;
}

.back-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

/* 排行榜内容 */
.rank-content {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

@media (min-width: 992px) {
  .rank-content {
    grid-template-columns: repeat(3, 1fr);
  }
}

.rank-section {
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.rank-header {
  background-color: #ffffff;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.rank-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin: 0;
  text-align: center;
}

.rank-list {
  padding: 0 8px;
}

.rank-item {
  display: flex;
  padding: 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.2s;
}

.rank-item:hover {
  background-color: #f9f9f9;
  transform: translateY(-2px);
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-number {
  font-size: 18px;
  font-weight: bold;
  color: #9ca3af;
  width: 25px;
  text-align: center;
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-1 {
  color: #f59e0b;
}

.rank-2 {
  color: #6b7280;
}

.rank-3 {
  color: #b45309;
}

.rank-cover-info {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.rank-cover {
  width: 70px;
  height: 90px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-right: 10px;
  flex-shrink: 0;
  background-color: #eee;
}

.rank-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s;
}

.rank-cover img[src=""] {
  opacity: 0;
}

.update-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: white;
  font-size: 10px;
  padding: 4px 6px;
  text-align: center;
}

.rank-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.rank-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.3;
}

.rank-meta {
  display: flex;
  font-size: 12px;
  color: #9ca3af;
}

.rank-year {
  margin-right: 12px;
}

.rank-hot {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  min-width: 70px;
  padding-left: 5px;
  text-align: right;
}

.hot-number {
  font-size: 15px;
  font-weight: bold;
  color: #f97316;
}

.hot-text {
  font-size: 10px;
  color: #9ca3af;
  margin-top: 2px;
}

/* 加载和空状态 */
.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #9ca3af;
}

.loading-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #e5e7eb;
  border-top-color: #1e40af;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text,
.empty-text {
  font-size: 14px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .rank-content {
    grid-template-columns: 1fr;
    padding: 15px;
  }
  
  .banner-area {
    height: 120px;
  }
  
  .banner-title {
    font-size: 24px;
  }
  
  .banner-subtitle {
    font-size: 12px;
  }
}
</style> 