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
    <div class="relative">
      <div class="w-full aspect-video bg-black">
        <img :src="videoInfo.cover" class="w-full h-full object-cover" alt="video cover" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center">
            <el-icon :size="32" class="text-white"><el-icon-video-play /></el-icon>
          </div>
        </div>
      </div>
      
      <!-- 返回按钮 -->
      <div class="absolute top-3 left-3">
        <div 
          class="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
          @click="goBack"
        >
          <el-icon class="text-white"><el-icon-arrow-left /></el-icon>
        </div>
      </div>
    </div>
    
    <!-- 视频信息 -->
    <div class="bg-white p-4">
      <h1 class="text-lg font-medium">{{ videoInfo.title }} {{ videoInfo.episode }}</h1>
      
      <div class="flex justify-between mt-2 text-sm text-gray-500">
        <div>{{ videoInfo.views }}播放 · {{ videoInfo.releaseDate }}</div>
        <div>{{ videoInfo.likes }}点赞</div>
      </div>
      
      <!-- 操作栏 -->
      <div class="flex justify-between mt-4 border-t border-b py-3">
        <div class="flex flex-col items-center" @click="toggleLike">
          <el-icon :size="24" :class="{'text-red-500': videoInfo.isLiked}">
            <el-icon-thumb v-if="!videoInfo.isLiked" />
            <el-icon-thumb v-else />
          </el-icon>
          <span class="text-xs mt-1">点赞</span>
        </div>
        
        <div class="flex flex-col items-center" @click="toggleCollect">
          <el-icon :size="24" :class="{'text-yellow-500': videoInfo.isCollected}">
            <el-icon-star v-if="!videoInfo.isCollected" />
            <el-icon-star-filled v-else />
          </el-icon>
          <span class="text-xs mt-1">收藏</span>
        </div>
        
        <div class="flex flex-col items-center">
          <el-icon :size="24"><el-icon-share /></el-icon>
          <span class="text-xs mt-1">分享</span>
        </div>
        
        <div class="flex flex-col items-center">
          <el-icon :size="24"><el-icon-download /></el-icon>
          <span class="text-xs mt-1">缓存</span>
        </div>
      </div>
      
      <!-- 标签页 -->
      <div class="flex border-b mt-2">
        <div 
          v-for="tab in tabs" 
          :key="tab" 
          class="mr-4 py-2 relative"
          :class="{'text-red-500 font-medium': activeTab === tab}"
          @click="activeTab = tab"
        >
          {{ tab }}
          <div v-if="activeTab === tab" class="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></div>
        </div>
      </div>
      
      <!-- 简介内容 -->
      <div v-if="activeTab === '简介'" class="py-3">
        <div class="flex flex-wrap gap-2 mb-3">
          <span 
            v-for="tag in videoInfo.tags" 
            :key="tag"
            class="px-2 py-1 bg-gray-100 rounded-full text-xs"
          >
            {{ tag }}
          </span>
        </div>
        
        <p class="text-sm text-gray-600">{{ videoInfo.description }}</p>
        
        <!-- 订阅按钮 -->
        <div class="mt-4 flex justify-between items-center">
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gray-200 rounded-full mr-2"></div>
            <span class="text-sm font-medium">XMoe动漫</span>
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
      <div v-else class="py-3 flex flex-col items-center justify-center text-gray-500">
        <el-icon :size="32" class="mb-2"><el-icon-chat-dot-round /></el-icon>
        <p class="text-sm">评论功能开发中...</p>
      </div>
    </div>
    
    <!-- 剧集列表 -->
    <div class="bg-white mt-2 p-4">
      <div class="flex justify-between items-center mb-3">
        <h3 class="font-medium">剧集</h3>
        <div class="text-xs text-gray-500">
          共12集，更新至12集 <el-icon><el-icon-arrow-down /></el-icon>
        </div>
      </div>
      
      <div class="grid grid-cols-4 gap-2">
        <div 
          v-for="episode in episodes" 
          :key="episode.id"
          class="p-2 border rounded-md text-center relative"
          :class="{'border-red-500 text-red-500': episode.id === 12, 'bg-gray-50': episode.watched}"
          @click="playVideo(episode.id)"
        >
          <div class="text-xs">{{ episode.title }}</div>
          <div 
            v-if="episode.watched" 
            class="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300"
          >
            <div class="h-full bg-red-500 w-full"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 相关推荐 -->
    <div class="bg-white mt-2 p-4">
      <h3 class="font-medium mb-3">相关推荐</h3>
      
      <div class="space-y-3">
        <div 
          v-for="video in relatedVideos" 
          :key="video.id"
          class="flex"
        >
          <div class="w-28 aspect-video rounded overflow-hidden">
            <img :src="video.cover" class="w-full h-full object-cover" />
          </div>
          <div class="ml-3 flex-1">
            <h4 class="text-sm font-medium line-clamp-2">{{ video.title }}</h4>
            <div class="flex justify-between text-xs text-gray-500 mt-2">
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
}
</style>