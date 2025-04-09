<script setup>
import { ref } from 'vue'

// 订阅番剧数据
const subscribedAnimes = [
  {
    id: 1,
    title: '快藏起来！玛琪娜同学！',
    cover: 'https://placeholder.pics/svg/120x160/FF9CAA/FFFFFF/封面1',
    episode: '更新至12集',
    isUpdated: true,
    weekday: '周一'
  },
  {
    id: 2,
    title: '葬送的芙莉莲',
    cover: 'https://placeholder.pics/svg/120x160/AACEEF/FFFFFF/封面2',
    episode: '更新至25集',
    isUpdated: false,
    weekday: '周六'
  },
  {
    id: 3,
    title: '间谍过家家 第二季',
    cover: 'https://placeholder.pics/svg/120x160/FFCEAA/FFFFFF/封面3',
    episode: '更新至18集',
    isUpdated: true,
    weekday: '周六'
  },
  {
    id: 4,
    title: '咒术回战 第二季',
    cover: 'https://placeholder.pics/svg/120x160/CEAAFF/FFFFFF/封面4',
    episode: '更新至23集',
    isUpdated: false,
    weekday: '周四'
  }
]

// 推荐订阅数据
const recommendedAnimes = [
  {
    id: 5,
    title: '久保同学不会放过我',
    cover: 'https://placeholder.pics/svg/120x160/AAFFAA/555555/封面5',
    tags: ['恋爱', '校园']
  },
  {
    id: 6,
    title: '东京复仇者 第三季',
    cover: 'https://placeholder.pics/svg/120x160/AAAAFF/FFFFFF/封面6',
    tags: ['热血', '战斗']
  }
]

const activeTab = ref('追番')
const tabs = ['追番', '我的收藏', '观看历史']
</script>

<template>
  <div class="subscription-container pb-16">
    <!-- 顶部标题栏 -->
    <div class="sticky top-0 bg-white z-10 px-4 py-3 border-b">
      <h1 class="text-lg font-medium text-center">我的订阅</h1>
    </div>
    
    <!-- 标签页 -->
    <div class="bg-white sticky top-12 z-10">
      <div class="flex border-b">
        <div 
          v-for="tab in tabs" 
          :key="tab" 
          class="flex-1 py-3 text-center text-sm"
          :class="{'text-red-500 border-b-2 border-red-500 font-medium': activeTab === tab}"
          @click="activeTab = tab"
        >
          {{ tab }}
        </div>
      </div>
    </div>
    
    <!-- 追番内容 -->
    <div v-if="activeTab === '追番'" class="p-4">
      <div v-if="subscribedAnimes.length > 0">
        <!-- 按周更新分组提示 -->
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-center">
            <el-icon class="mr-1 text-red-500"><el-icon-calendar /></el-icon>
            <span class="text-sm font-medium">按更新时间查看</span>
          </div>
          <el-button type="danger" size="small" plain round>追番管理</el-button>
        </div>
        
        <!-- 订阅列表 -->
        <div class="grid grid-cols-2 gap-3">
          <div 
            v-for="anime in subscribedAnimes" 
            :key="anime.id"
            class="bg-white rounded-lg overflow-hidden shadow-sm"
          >
            <div class="relative">
              <img :src="anime.cover" class="w-full h-auto object-cover" />
              <div 
                v-if="anime.isUpdated"
                class="absolute top-0 right-0 bg-red-500 text-white text-xs px-2 py-1 rounded-bl"
              >
                有更新
              </div>
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <div class="flex justify-between items-center">
                  <span class="text-white text-xs">{{ anime.weekday }}</span>
                  <span class="text-white text-xs">{{ anime.episode }}</span>
                </div>
              </div>
            </div>
            <div class="p-2">
              <p class="text-sm font-medium line-clamp-1">{{ anime.title }}</p>
            </div>
          </div>
        </div>
        
        <!-- 推荐订阅 -->
        <div class="mt-6">
          <h3 class="text-base font-medium mb-3">推荐订阅</h3>
          <div class="grid grid-cols-2 gap-3">
            <div 
              v-for="anime in recommendedAnimes" 
              :key="anime.id"
              class="bg-white rounded-lg overflow-hidden shadow-sm"
            >
              <div class="relative">
                <img :src="anime.cover" class="w-full h-auto object-cover" />
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  <div class="flex flex-wrap gap-1">
                    <span 
                      v-for="(tag, index) in anime.tags" 
                      :key="index"
                      class="bg-white/30 text-white text-xs px-1 rounded"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="p-2">
                <p class="text-sm font-medium line-clamp-1">{{ anime.title }}</p>
                <div class="flex justify-end mt-1">
                  <el-button type="danger" size="small" plain>+ 追番</el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-else class="flex flex-col items-center justify-center py-10">
        <el-icon :size="48" class="text-gray-300 mb-4"><el-icon-star /></el-icon>
        <p class="text-gray-500 mb-4">还没有追番哦</p>
        <el-button type="danger" plain>去发现动漫</el-button>
      </div>
    </div>
    
    <!-- 其他标签页占位 -->
    <div v-else class="flex flex-col items-center justify-center py-10">
      <el-icon :size="48" class="text-gray-300 mb-4"><el-icon-collection /></el-icon>
      <p class="text-gray-500">{{ activeTab }}内容暂未开发</p>
    </div>
  </div>
</template>

<style scoped>
.subscription-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style> 