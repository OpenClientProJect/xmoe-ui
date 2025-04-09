<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchKeyword = ref('')
const historySearches = ref(['海贼王', '间谍过家家', '名侦探柯南', '鬼灭之刃'])

// 模拟搜索结果
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

const goBack = () => {
  router.back()
}

const handleSearch = () => {
  if (!searchKeyword.value) return
  // 实际项目中这里应该发起请求获取搜索结果
  searchResults.value = [
    {
      id: 1,
      title: `搜索"${searchKeyword.value}"的结果1`,
      episode: '更新至12集',
      cover: 'https://placeholder.pics/svg/120x80/DEDEDE/555555/封面1'
    },
    {
      id: 2,
      title: `搜索"${searchKeyword.value}"的结果2`,
      episode: '更新至24集',
      cover: 'https://placeholder.pics/svg/120x80/DEDEDE/555555/封面2'
    }
  ]
  
  // 添加到搜索历史
  if (!historySearches.value.includes(searchKeyword.value)) {
    historySearches.value.unshift(searchKeyword.value)
    if (historySearches.value.length > 8) {
      historySearches.value.pop()
    }
  }
}

const selectHotSearch = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

const clearHistory = () => {
  historySearches.value = []
}

const selectHistorySearch = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
}

const clearSearchKeyword = () => {
  searchKeyword.value = ''
  searchResults.value = []
}
</script>

<template>
  <div class="search-container">
    <!-- 搜索头部 -->
    <div class="sticky top-0 z-10 bg-white px-4 py-2 flex items-center border-b">
      <el-icon class="mr-2 text-gray-600" @click="goBack"><el-icon-arrow-left /></el-icon>
      
      <div class="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2 relative">
        <img src="@/assets/icon/search.svg" class="w-4 h-4 mr-2" alt="search" />
        <input 
          v-model="searchKeyword"
          class="bg-transparent flex-1 focus:outline-none text-sm"
          placeholder="搜索" 
          @keydown.enter="handleSearch"
        />
        <el-icon v-if="searchKeyword" class="text-gray-400 cursor-pointer" @click="clearSearchKeyword">
          <el-icon-close-bold />
        </el-icon>
      </div>
      
      <el-button class="ml-2" type="danger" plain size="small" @click="handleSearch">搜索</el-button>
    </div>
    
    <!-- 搜索内容区域 -->
    <div class="p-4">
      <!-- 搜索结果 -->
      <div v-if="searchResults.length > 0">
        <h3 class="text-lg font-medium mb-3">搜索结果</h3>
        <div class="space-y-3">
          <div v-for="result in searchResults" :key="result.id" class="flex border-b pb-3">
            <img :src="result.cover" class="w-24 h-16 object-cover rounded" />
            <div class="ml-3 flex-1">
              <h4 class="text-sm font-medium line-clamp-1">{{ result.title }}</h4>
              <p class="text-xs text-gray-500 mt-1">{{ result.episode }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 未搜索时显示历史记录和热搜 -->
      <div v-else>
        <!-- 搜索历史 -->
        <div v-if="historySearches.length > 0" class="mb-6">
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-base font-medium">搜索历史</h3>
            <el-icon @click="clearHistory"><el-icon-delete /></el-icon>
          </div>
          
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="(history, index) in historySearches" 
              :key="index"
              class="px-3 py-1 bg-gray-100 rounded-full text-sm cursor-pointer"
              @click="selectHistorySearch(history)"
            >
              {{ history }}
            </span>
          </div>
        </div>
        
        <!-- 热门搜索 -->
        <div>
          <h3 class="text-base font-medium mb-3">热门搜索</h3>
          <div class="grid grid-cols-2 gap-3">
            <div 
              v-for="(hot, index) in hotSearches" 
              :key="index"
              class="flex items-center"
              @click="selectHotSearch(hot)"
            >
              <span class="w-5 h-5 flex items-center justify-center mr-2" :class="{'text-red-500': index < 3, 'text-gray-400': index >= 3}">{{ index + 1 }}</span>
              <span class="text-sm line-clamp-1">{{ hot }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-container {
  min-height: 100vh;
  background-color: white;
}
</style> 