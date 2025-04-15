<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {getDramaListService} from "@/api/Drama.js";
import { handleImageUrl } from '@/utils/imageUtils';
import { decryptHexString } from '@/utils/aesUtils'; // 导入解密工具

const router = useRouter()

// 番剧列表
const DramaList = ref([])

// 筛选分类
const animeFilters = [
  { name: '最新', active: true },
  { name: '类型', active: false },
  { name: '地区', active: false },
  { name: '语言', active: false },
  { name: '年份', active: false }
]

const activeFilter = ref('最新')
const isLoading = ref(false) // 添加加载状态
const hasError = ref(false) // 添加错误状态
const errorMessage = ref('') // 错误信息

// 切换筛选分类
const changeFilter = (filter) => {
  activeFilter.value = filter
  // 可以根据筛选条件重新获取数据
  getDramaList()
}

// 处理加密的数据
const decryptData = (encryptedData) => {
  try {
    console.log('原始响应数据类型:', typeof encryptedData)
    if (typeof encryptedData === 'object') {
      console.log('响应数据已经是对象:', encryptedData)
      return encryptedData
    }
    
    // 判断数据是否以'FROMSKZZJM'开头
    if (typeof encryptedData === 'string') {
      let hexData = encryptedData
      if (hexData.startsWith('FROMSKZZJM')) {
        console.log('检测到加密数据，准备解密')
        // 去掉前缀'FROMSKZZJM'
        hexData = hexData.substring('FROMSKZZJM'.length)
        
        // 使用aesUtils中的方法解密
        const decrypted = decryptHexString(hexData)
        
        // 解析JSON
        try {
          const jsonData = JSON.parse(decrypted)
          console.log('解密成功，数据结构:', jsonData)
          return jsonData
        } catch (jsonError) {
          console.error('JSON解析错误:', jsonError)
          errorMessage.value = '解析JSON数据失败'
          return null
        }
      } else {
        console.log('数据不是加密格式')
        // 尝试直接解析JSON
        try {
          return JSON.parse(encryptedData)
        } catch (e) {
          console.log('无法解析为JSON，返回原始数据')
          return encryptedData
        }
      }
    }
    
    return encryptedData
  } catch (error) {
    console.error('解密数据失败:', error)
    errorMessage.value = '解密数据失败: ' + error.message
    return null
  }
}

// 获取番剧列表
const getDramaList = async () => {
  try {
    isLoading.value = true
    hasError.value = false
    errorMessage.value = ''
    
    console.log('开始获取番剧列表')
    const response = await getDramaListService()
    console.log('获取到原始响应:', response)
    
    // 检查响应是否有效
    if (!response) {
      throw new Error('未收到有效响应')
    }
    
    // 处理响应数据
    let responseData = response
    if (response.data !== undefined) {
      responseData = response.data
    }
    
    // 解密数据
    const decryptedData = decryptData(responseData)
    
    if (!decryptedData) {
      throw new Error('数据解密失败或解密结果为空')
    }
    
    console.log('解密后的数据:', decryptedData)
    
    // 处理解密后的数据
    let finalList = []
    
    // 根据实际数据结构提取列表
    if (Array.isArray(decryptedData)) {
      finalList = decryptedData
    } else if (decryptedData.list && Array.isArray(decryptedData.list)) {
      finalList = decryptedData.list
    } else if (decryptedData.data) {
      if (Array.isArray(decryptedData.data)) {
        finalList = decryptedData.data
      } else if (decryptedData.data.list && Array.isArray(decryptedData.data.list)) {
        finalList = decryptedData.data.list
      }
    } else {
      // 未识别的数据结构，可能是单个对象
      console.log('未识别的数据结构:', decryptedData)
      
      // 如果看起来像一个番剧对象，放入数组
      if (decryptedData.vod_id || decryptedData.id || decryptedData.name || decryptedData.vod_name) {
        finalList = [decryptedData]
      } else {
        // 真的无法处理
        throw new Error('无法识别的数据结构')
      }
    }
    
    console.log('最终处理后的番剧列表:', finalList)
    DramaList.value = finalList
    
    if (finalList.length === 0) {
      console.log('番剧列表为空')
    }
  } catch (error) {
    console.error('获取番剧列表失败:', error)
    hasError.value = true
    errorMessage.value = error.message || '获取数据失败'
    DramaList.value = []
  } finally {
    isLoading.value = false
  }
}

// 跳转到详情页
const goToAnimeDetail = (id) => {
  if (!id) {
    console.error('无效的番剧ID')
    return
  }
  console.log('跳转到番剧详情页,ID:', id)
  router.push(`/video/${id}`)
}

// 挂载函数
onMounted(() => {
  getDramaList()
})
</script>

<template>
  <div class="anime-content">
    <!-- 筛选条件 -->
    <div class="filter-container">
      <div 
        v-for="filter in animeFilters" 
        :key="filter.name"
        class="filter-item"
        :class="{'filter-active': activeFilter === filter.name}"
        @click="changeFilter(filter.name)"
      >
        {{ filter.name }}
        <span v-if="filter.name !== '最新'" class="filter-arrow">▼</span>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="hasError" class="error-container">
      <p>{{ errorMessage || '加载失败，请重试' }}</p>
      <button @click="getDramaList" class="retry-button">重新加载</button>
    </div>

    <!-- 空数据提示 -->
    <div v-else-if="DramaList.length === 0" class="empty-container">
      <p>暂无数据</p>
    </div>

    <!-- 番剧列表 -->
    <div v-else class="anime-list">
      <div 
        v-for="anime in DramaList"
        :key="anime.vod_id || anime.id"
        class="anime-card"
        @click="goToAnimeDetail(anime.vod_id || anime.id)"
      >
        <div class="anime-cover">
          <img :src="handleImageUrl(anime.vod_pic || anime.pic)" alt="anime cover" class="anime-img" />
          <span class="anime-episodes">{{ anime.vod_remarks || anime.remarks || '更新中' }}</span>
        </div>
        <div class="anime-title">{{ anime.vod_name || anime.name }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 番剧内容区域 */
.anime-content {
  padding: 0 0 80px;
}

/* 筛选条件 */
.filter-container {
  display: flex;
  overflow-x: auto;
  background: #fff;
  padding: 10px 15px;
  margin-bottom: 10px;
  scrollbar-width: none;
}

.filter-container::-webkit-scrollbar {
  display: none;
}

.filter-item {
  padding: 5px 12px;
  margin-right: 15px;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.filter-arrow {
  font-size: 10px;
  margin-left: 4px;
}

.filter-active {
  color: #dc2626;
  font-weight: 500;
}

/* 番剧列表 */
.anime-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 12px;
}

.anime-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.anime-cover {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 3/4;
}

.anime-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.anime-title {
  font-size: 12px;
  margin-top: 6px;
  text-align: center;
  line-height: 1.3;
  height: 2.6em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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
  border-top: 3px solid #dc2626;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误和空数据容器 */
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #666;
}

.retry-button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #dc2626;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #b91c1c;
}
</style> 