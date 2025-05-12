<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { searchService } from '@/api/home/anime.js'
import { handleImageUrl } from '@/utils/imageUtils'
import { ElLoading } from 'element-plus'

const router = useRouter()
const route = useRoute()
const searchKeyword = ref('')
const historySearches = ref(['海贼王', '间谍过家家', '名侦探柯南', '鬼灭之刃'])
const isLoading = ref(false)

// 搜索结果
const searchResults = ref([])
const hotSearches = [
  '咒术回战',
  '葬送的芙莉莲',
  '名侦探柯南',
  '海贼王',
  '间谍过家家 第二季',
  '我推的孩子',
  '五等分的花嫁',
  '鬼灭之刃 刀匠村篇'
]

// 从路由获取搜索关键词
const getSearchFromRoute = () => {
  if (route.query.keyword) {
    searchKeyword.value = route.query.keyword
    // 不自动触发搜索，只设置关键词
  }
}

// 监听路由变化
watch(() => route.query.keyword, (newKeyword) => {
  if (newKeyword) {
    searchKeyword.value = newKeyword
    // 不自动触发搜索，只设置关键词
  }
})

const goBack = () => {
  router.push('/')
}

const handleSearch = async () => {
  if (!searchKeyword.value.trim()) return
  
  try {
    isLoading.value = true
    const loadingInstance = ElLoading.service({
      lock: true,
      text: '搜索中...',
      background: 'rgba(255, 255, 255, 0.7)',
    })
    
    const res = await searchService({
      keyword: searchKeyword.value
    })
    
    if (res.code === 200 && res.data) {
      // 处理API返回的数据
      searchResults.value = res.data.map(item => {
        // 提取内容中的纯文本
        let content = ''
        if (item.vod_content) {
          // 移除HTML标签，获取纯文本
          content = item.vod_content.replace(/<[^>]+>/g, '')
          // 截取前100个字符
          content = content.substring(0, 100) + (content.length > 100 ? '...' : '')
        }
        
        return {
          id: item.vod_id,
          title: item.vod_name,
          episode: item.vod_remarks || '更新中',
          cover: handleImageUrl(item.vod_pic),
          score: item.vod_score || '0',
          area: item.vod_area || '',
          year: item.vod_year || '',
          tags: item.vod_class ? item.vod_class.split(',') : [],
          hits: item.vod_hits || 0,
          content: content
        }
      })
      
      // 更新URL，不刷新页面
      router.push({
        query: { ...route.query, keyword: searchKeyword.value }
      }, { replace: true })
    } else {
      searchResults.value = []
      console.error('搜索失败:', res.message || '未知错误')
    }
    
    // 添加到搜索历史
    if (!historySearches.value.includes(searchKeyword.value)) {
      historySearches.value.unshift(searchKeyword.value)
      if (historySearches.value.length > 8) {
        historySearches.value.pop()
      }
      // 将搜索历史保存到本地存储
      localStorage.setItem('searchHistory', JSON.stringify(historySearches.value))
    }
    
    loadingInstance.close()
  } catch (error) {
    console.error('搜索出错:', error)
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

const selectHotSearch = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

const clearHistory = () => {
  historySearches.value = []
  localStorage.removeItem('searchHistory')
}

const selectHistorySearch = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

const clearSearchKeyword = () => {
  searchKeyword.value = ''
  searchResults.value = []
}

// 点击搜索结果项，跳转到详情页
const goToDetail = (id) => {
  router.push(`/video/${id}`)
}

// 从本地存储加载搜索历史
const loadSearchHistory = () => {
  const savedHistory = localStorage.getItem('searchHistory')
  if (savedHistory) {
    try {
      historySearches.value = JSON.parse(savedHistory)
    } catch (e) {
      console.error('解析搜索历史失败:', e)
    }
  }
}

onMounted(async () => {
  // 加载搜索历史
  loadSearchHistory()
  // 从路由获取搜索关键词
  getSearchFromRoute()
})
</script>

<template>
  <div class="search-container">
    <!-- 搜索头部 -->
    <div class="search-header">
      <el-icon class="back-icon" @click="goBack"><img src="@/assets/icon/return.svg"></el-icon>
      
      <div class="search-input-container">
        <el-icon class="search-icon"><img src="@/assets/icon/search.svg" alt="search"></el-icon>
        <input
          v-model="searchKeyword"
          class="search-input"
          placeholder="搜索" 
          @keydown.enter="handleSearch"
        />
        <el-icon v-if="searchKeyword" class="clear-icon" @click="clearSearchKeyword">
          <el-icon-close-bold />
        </el-icon>
      </div>
      <div class="search-button" @click="handleSearch">搜索</div>
    </div>
    
    <!-- 搜索内容区域 -->
    <div class="search-content">
      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0">
        <h3 class="section-title">搜索结果</h3>
        <div class="search-results-list">
          <div 
            v-for="result in searchResults" 
            :key="result.id" 
            class="search-result-item"
            @click="goToDetail(result.id)"
          >
            <div class="result-cover">
              <img :src="result.cover" alt="封面" />
              <span class="result-episode">{{ result.episode }}</span>
            </div>
            <div class="result-info">
              <div class="result-header">
                <h4 class="result-title">{{ result.title }}</h4>
              </div>
              <div class="result-score" v-if="result.score">
                <span class="score-value">{{ result.score }}</span>分
              </div>
              <div class="result-meta">
                <span class="result-year" v-if="result.year">{{ result.year }}</span>
                <span class="result-area" v-if="result.area">{{ result.area }}</span>
                <span class="result-hits" v-if="result.hits">{{ result.hits }}次播放</span>
              </div>
              <div class="result-tags" v-if="result.tags && result.tags.length">
                <span class="result-tag" v-for="(tag, idx) in result.tags.slice(0, 3)" :key="idx">{{ tag }}</span>
              </div>
              <div class="result-content" v-if="result.content">
                <p>{{ result.content }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 未搜索时显示历史记录和热搜 -->
      <div v-else-if="!searchKeyword.trim()">
        <!-- 搜索历史 -->
        <div v-if="historySearches.length > 0" class="history-section">
          <div class="section-header">
            <h3 class="section-title">搜索历史</h3>
            <el-icon class="clear-history" @click="clearHistory"><el-icon-delete /></el-icon>
          </div>
          
          <div class="history-tags">
            <span 
              v-for="(history, index) in historySearches" 
              :key="index"
              class="history-tag"
              @click="selectHistorySearch(history)"
            >
              {{ history }}
            </span>
          </div>
        </div>
        
        <!-- 热门搜索 -->
        <div class="hot-search-section">
          <h3 class="section-title">热门搜索</h3>
          <div class="hot-search-grid">
            <div 
              v-for="(hot, index) in hotSearches" 
              :key="index"
              class="hot-search-item"
              @click="selectHotSearch(hot)"
            >
              <span class="hot-rank" :class="{'top-rank': index < 3}">{{ index + 1 }}</span>
              <span class="hot-title">{{ hot }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 搜索无结果时显示 -->
      <div v-else class="no-result-container">
        <div class="no-result-icon">
          <el-icon><img src="@/assets/icon/search.svg" alt="search"></el-icon>
        </div>
        <div class="no-result-text">回车搜索或点击搜索"{{ searchKeyword }}"相关内容</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  min-height: 100vh;
  position: relative;
  overflow-x: hidden;
}

/* 固定头部样式 */
.search-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background-color: #fff;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  /* 硬件加速，减少抖动 */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

.back-icon {
  margin-right: 8px;
  color: #606266;
}

.search-input-container {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 999px;
  padding: 8px 16px;
  position: relative;
}

.search-icon {
  width: 18px;
  height: 18px;
  margin-right: 8px;
  color: #9ca3af;
}

.search-input {
  background-color: transparent;
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #374151;
}

.clear-icon {
  color: #9ca3af;
  cursor: pointer;
}

.search-button {
  margin-left: 12px;
  font-size: 14px;
  color: #dc2626;
  font-weight: 500;
  cursor: pointer;
}

/* 内容区域样式 */
.search-content {
  /* 搜索头部高度 + 额外空间 */
  padding: 60px 16px 24px;
  min-height: calc(100vh - 60px);
}

/* 区域标题样式 */
.section-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #333;
  padding-top: 16px;
}

/* 搜索历史样式 */
.history-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.clear-history {
  color: #9ca3af;
  cursor: pointer;
  font-size: 14px;
}

.history-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.history-tag {
  padding: 8px 16px;
  background-color: #f3f4f6;
  border-radius: 20px;
  font-size: 13px;
  color: #4b5563;
  cursor: pointer;
  transition: background-color 0.2s;
}

.history-tag:hover {
  background-color: #e5e7eb;
}

/* 热门搜索样式 */
.hot-search-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.hot-search-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.hot-rank {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: #9ca3af;
  font-weight: 500;
  font-size: 16px;
}

.top-rank {
  color: #dc2626;
  font-weight: 600;
}

.hot-title {
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

/* 搜索结果样式 */
.search-results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.search-result-item {
  display: flex;
  cursor: pointer;
  background-color: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 20px;
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 4px;
}

.search-result-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.result-cover {
  width: 140px;
  height: 186px;
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.result-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.result-episode {
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  text-align: right;
  width: 100%;
}

.result-info {
  padding: 0 0 0 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.result-title {
  font-size: 18px;
  margin: 0 0 10px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  color: #333;
  font-weight: 600;
}

.result-meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.result-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 2px;
}

.result-tag {
  font-size: 10px;
  padding: 2px 6px;
  background-color: #f3f4f6;
  border-radius: 4px;
  color: #6b7280;
  display: inline-block;
  margin-right: 4px;
  margin-bottom: 4px;
}

.result-score {
  font-size: 13px;
  padding: 2px 6px;
  white-space: nowrap;
  display: inline-block;
  margin-bottom: 8px;
  margin-top: -5px;
}

.score-value {
  color: #dc2626;
  font-weight: 600;
}

.result-content {
  font-size: 13px;
  color: #6b7280;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  margin-top: 0;
}

/* 无搜索结果样式 */
.no-result-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.no-result-icon {
  font-size: 48px;
  color: #d1d5db;
  margin-bottom: 16px;
}

.no-result-text {
  font-size: 16px;
  color: #374151;
  margin-bottom: 8px;
  font-weight: 500;
}

.no-result-tips {
  font-size: 14px;
  color: #9ca3af;
}
</style>