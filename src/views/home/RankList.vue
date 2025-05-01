<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { getRankListService } from '@/api/home/anime.js'
import { handleImageUrl } from '@/utils/imageUtils.js'

import Loading from '@/assets/gif/loading.gif'

const router = useRouter()

// 处理图片加载错误
const handleImageError = (event) => {
  event.target.src = Loading
}

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
        
          // 处理排行榜数据
          rankData.value[type] = res.data.map((item, index) => ({
            id: item.vod_id,
            rank: index + 1,
            title: item.vod_name,
            score: parseFloat(item.vod_douban_score || '0').toFixed(1) || '暂无评分',
            cover: handleImageUrl(item.vod_pic || ''),
            updateInfo: item.vod_remarks || '暂无更新',
            hot: item.vod_hits || 0,
            year: item.vod_year || '',
            content: item.vod_content || '暂无简介' // 添加简介字段
          }))
      } finally {
        loading.value[type] = false
      }
    }
  } catch (error) {
    console.error('获取排行榜数据失败:', error)
  }
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
          <h2 class="rank-title">番剧</h2>
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
                <div class="rank-title" :title="item.title">{{ item.title }}</div>
                <div class="rank-desc">{{ item.content }}</div>
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
                <div class="rank-title" :title="item.title">{{ item.title }}</div>
                <div class="rank-desc">{{ item.content }}</div>
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
                <div class="rank-title" :title="item.title">{{ item.title }}</div>
                <div class="rank-desc">{{ item.content }}</div>
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
      
      <!-- 待添加专区排行榜 -->
      <div class="rank-section">
        <div class="rank-header">
          <h2 class="rank-title">当季新番</h2>
        </div>
        
        <!-- 加载提示 -->
        <div v-if="loading.tj" class="loading-container">
          <div class="loading-spinner"></div>
          <div class="loading-text">加载中...</div>
        </div>
        
        <!-- 无数据提示 -->
        <div v-else-if="rankData.tj.length === 0" class="empty-container">
          <div class="empty-text">暂无排行榜数据</div>
        </div>
        
        <!-- 排行榜列表 -->
        <div v-else class="rank-list">
          <div 
            v-for="item in rankData.tj.slice(0, 7)" 
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
                <div class="rank-title" :title="item.title">{{ item.title }}</div>
                <div class="rank-desc">{{ item.content }}</div>
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
  height: 180px;
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
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 10px;
  position: relative;
  display: inline-block;
}

.banner-subtitle {
  font-size: 16px;
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
  gap: 25px;
  padding: 30px;
  max-width: 1700px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* 动态适配不同屏幕宽度 */
@media (min-width: 640px) {
  .rank-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 25px;
    padding: 25px;
  }
}

@media (min-width: 992px) {
  .rank-content {
    grid-template-columns: repeat(3, 1fr);
    gap: 30px;
    padding: 30px;
  }
}

.rank-section {
  background-color: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.rank-section:hover {
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.rank-header {
  background-color: #ffffff;
  padding: 20px 20px;
  border-bottom: 1px solid #f0f0f0;
  text-align: center;
  position: relative;
}

.rank-header .rank-title {
  font-size: 26px;
  font-weight: 800;
  color: #1a237e;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
  display: inline-block;
  position: relative;
}

.rank-header .rank-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: linear-gradient(to right, #1a237e, #3949ab);
  border-radius: 2px;
}

.rank-list {
  padding: 0 12px;
  flex: 1;
  overflow: auto;
  scroll-behavior: smooth;
}

.rank-item {
  display: flex;
  padding: 15px 12px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: transform 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
  border-radius: 6px;
  margin-bottom: 4px;
}

.rank-item:hover {
  background-color: #f9fafb;
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
  border-bottom-color: transparent;
}

.rank-item:last-child {
  border-bottom: none;
}

.rank-number {
  font-size: 26px;
  font-weight: 800;
  color: #9ca3af;
  width: 34px;
  text-align: center;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rank-cover-info {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.rank-cover {
  width: 85px;
  height: 110px;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  margin-right: 12px;
  flex-shrink: 0;
  background-color: #eee;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.rank-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s;
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
  flex: 1;
  padding-right: 5px;
}

.rank-title {
  font-size: 18px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.rank-desc {
  font-size: 14px;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
  line-height: 1.4;
}

.rank-meta {
  display: flex;
  font-size: 12px;
  color: #9ca3af;
}

.rank-year {
  font-size: 13px;
  padding: 2px 8px;
  background-color: #f3f4f6;
  border-radius: 4px;
  display: inline-block;
}

.rank-hot {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  min-width: 80px;
  padding-left: 12px;
  text-align: right;
  position: relative;
}

.hot-number {
  font-size: 22px;
  font-weight: 800;
  color: #f97316;
  background: -webkit-linear-gradient(#f97316, #ea580c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
}

.hot-text {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
  font-weight: 500;
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
  min-height: 200px;
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
@media (max-width: 639px) {
  .rank-content {
    grid-template-columns: 1fr;
    padding: 12px;
    gap: 12px;
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
  
  .rank-section {
    margin-bottom: 0;
  }
  
  .rank-cover {
    width: 60px;
    height: 80px;
  }
  
  .rank-header {
    padding: 15px;
  }
  
  .rank-header .rank-title {
    font-size: 20px;
  }
  
  .rank-item {
    padding: 10px;
  }
  
  .rank-number {
    font-size: 20px;
    width: 24px;
    margin-right: 8px;
    font-weight: 800;
  }
  
  .rank-title {
    font-size: 15px;
    font-weight: 700;
  }
  
  .rank-desc {
    font-size: 11px;
    -webkit-line-clamp: 1;
  }
  
  .hot-number {
    font-size: 18px;
    font-weight: 800;
  }
  
  .rank-info .rank-title {
    font-size: 15px;
    font-weight: 700;
  }
}
</style> 