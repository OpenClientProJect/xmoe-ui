<script setup>
import {ref, onMounted, computed} from 'vue'
import {useRouter} from 'vue-router'
// 导入样式
import 'swiper/css'
import 'swiper/css/pagination'
// 导入番剧列表组件
import AnimeList from '@/views/home/DramaList.vue'
// 导入轮播图组件
import BannerCarousel from '@/views/home/BannerCarousel.vue'
import {getBannerListService, getDramaListService, getDramaScheduleService} from "@/api/home/anime.js";
import { handleImageUrl, handleImageError } from '@/utils/imageUtils' // 导入图片工具类函数
import useUserInfoStore from "@/stores/userstores.js"; // 导入用户信息store
import { ElMessage } from 'element-plus' // 导入消息组件
import Loading from '@/assets/gif/loading.gif'

const router = useRouter()
const userStore = useUserInfoStore()
const activeTab = ref('推荐')

// 添加番剧数据
const animeList = []

// 模拟追番日历数据
const activeDay = ref(0) // 默认选中周一

// 按周几分类的动漫数据
const calendarByDay = ref({
  0: [], // 周一
  1: [], // 周二
  2: [], // 周三
  3: [], // 周四
  4: [], // 周五
  5: [], // 周六
  6: [], // 周日
})

// 获取当前选中日期的动漫列表
const currentDayAnimes = computed(() => {
  if (!calendarByDay.value || !calendarByDay.value[activeDay.value]) {
    return []
  }
  return calendarByDay.value[activeDay.value]
})

// 切换选中的日期
const switchDay = (dayIndex) => {
  activeDay.value = dayIndex
  // 切换日期后重新获取该日期的排期数据
  getDramaSchedule()
}

// 模拟四月新番数据
const newAnimes = ref([])

// 轮播图数据
const swiperImages = ref([])

//获取轮播图数据
const getSwiperImages = async () => {
  const res = await getBannerListService()

  // 转换API返回的数据到我们需要的格式
  swiperImages.value = res.data.map((item, index) => ({
    id: item.vod_id,
    url: item.vod_pic_slide || item.vod_pic_thumb || item.vod_pic,
    title: item.vod_name,
    subtitle: item.vod_remarks || '暂无更新信息'
  }))
}

//新番列表
const getNewAnimes = async () => {
  const res = await getDramaListService()

  // 转换API返回的数据到我们需要的格式
  newAnimes.value = res.data.map((item) => ({
    id: item.vod_id,
    title: item.vod_name,
    episode: item.vod_remarks || '暂无更新信息',
    cover: item.vod_pic_thumb || item.vod_pic,
    updateTime: item.vod_weekday || '',
    actors: item.vod_actor ? item.vod_actor.split(' / ').slice(0, 3).join('、') : '暂无演员信息',
    categories: item.vod_class ? item.vod_class.split(',').join('、') : '暂无分类'
  }))
}

//排期表
const loadingSchedule = ref(false)
const getDramaSchedule = async () => {
  loadingSchedule.value = true
  try {
    // 定义周几的映射数组
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    // 获取当前选中的周几作为typeKey参数
    const typeKey = weekdays[activeDay.value]
    // 调用API时传递typeKey参数
    const res = await getDramaScheduleService(typeKey)

    if (res && res.code === 200 && res.data && res.data.length > 0) {
      // 确保每个日期的数组都被初始化
      for (let i = 0; i < 7; i++) {
        if (!calendarByDay.value[i]) {
          calendarByDay.value[i] = []
        } else {
          calendarByDay.value[i] = [] // 清空现有数据，避免重复
        }
      }
      
      // 解析周几数据
      res.data.forEach(item => {
        const weekday = item.vod_weekday || ''
        
        // 处理周几信息
        let dayIndex = -1
        if (weekday.includes('周一') || weekday.includes('每周一')) {
          dayIndex = 0
        } else if (weekday.includes('周二') || weekday.includes('每周二')) {
          dayIndex = 1
        } else if (weekday.includes('周三') || weekday.includes('每周三')) {
          dayIndex = 2
        } else if (weekday.includes('周四') || weekday.includes('每周四')) {
          dayIndex = 3
        } else if (weekday.includes('周五') || weekday.includes('每周五')) {
          dayIndex = 4
        } else if (weekday.includes('周六') || weekday.includes('每周六')) {
          dayIndex = 5
        } else if (weekday.includes('周日') || weekday.includes('每周日')) {
          dayIndex = 6
        }
        
        if (dayIndex >= 0) {
          // 格式化动漫数据
          calendarByDay.value[dayIndex].push({
            id: item.vod_id,
            title: item.vod_name,
            updateTime: item.vod_weekday,
            episode: item.vod_remarks,
            cover: item.vod_pic_thumb || item.vod_pic_slide || item.vod_pic,
            year: item.vod_year || '2025',
            categories: item.vod_class ? item.vod_class.split(',').join('、') : ''
          })
        }
      })
      
    }
  } catch (error) {
    console.error('获取排期表数据失败:', error)
  } finally {
    loadingSchedule.value = false
  }
}

onMounted(() => {
  //轮播图
  getSwiperImages()
  //排期表
  getDramaSchedule()
  // 新番列表
  getNewAnimes()
})

// 处理标签切换事件
const handleTabChange = (tab) => {
  activeTab.value = tab
  console.log('切换到标签:', tab)
  // 向父组件(HomeLayout)发送tab-change事件
  emit('tab-change', tab)
}

// 定义emit
const emit = defineEmits(['tab-change'])

// 在轮播图中点击跳转到详情页
const goToVideoDetail = (id) => {
  if (id) {
    router.push(`/video/${id}`)
  }
}

// 跳转到排行榜页面
const goToRankList = () => {
  router.push('/rank')
}

// 跳转到追番页面
const goToFavorites = () => {
  // 检查用户是否已登录
  if (userStore.info && userStore.info.user_id) {
    router.push({
      path: `/history/${userStore.info.user_id}`,
      query: { tab: 'collect' }
    });
  } else {
    ElMessage.warning('请先登录');
    router.push('/login');
  }
}

// 排期表滚动控制
const scheduleContainerRef = ref(null)

// 滚动排期表内容
const scrollSchedule = (direction) => {
  if (!scheduleContainerRef.value) return

  const container = scheduleContainerRef.value
  const scrollAmount = container.clientWidth * 0.8 // 滚动80%的容器宽度

  if (direction === 'left') {
    container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
  } else {
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="home-container">
    <!-- 内容区域 -->
    <div class="page-content">
      <!-- 推荐标签页内容 -->
      <div v-if="activeTab === '推荐'">
        <!-- 轮播图组件 -->
        <BannerCarousel :banners="swiperImages"/>

        <!-- 快捷分类 -->
        <div class="category-buttons mx-4 my-4">
          <div class="category-btn category-btn-blue">
            <span>全部</span>
          </div>
          <div class="category-btn category-btn-pink" @click="goToRankList">
            <span>榜单</span>
          </div>
          <div class="category-btn category-btn-purple">
            <span>海贼王</span>
          </div>
          <div class="category-btn category-btn-indigo" @click="goToFavorites">
            <span>追番</span>
          </div>
        </div>

        <!-- 追番日历 -->
        <div class="px-4 mt-5">
          <!-- 排期表标题 -->
          <h2 class="text-xl font-bold mb-3">排期表</h2>
          
          <!-- 周一至周日标签栏 -->
          <div class="flex overflow-x-auto no-scrollbar mb-4 schedule-tabs-container">
            <div
                v-for="(day, index) in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']"
                :key="index"
                class="day-tab text-center text-xs sm:text-sm font-medium whitespace-nowrap cursor-pointer px-2 py-1 sm:px-3 sm:py-1 rounded-full transition-colors duration-300 mx-1"
                :class="{ active: Number(activeDay) === index }"
                @click="switchDay(index)"
            >
              {{ day }}
            </div>
          </div>

          <!-- 动漫卡片轮播 - 横向滑动 -->
          <div class="relative">
            <!-- 左侧切换按钮 -->
            <div 
              class="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 ml-1"
              @click="scrollSchedule('left')"
            >
              <div class="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
              </div>
                </div>

            <!-- 右侧切换按钮 -->
            <div 
              class="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 mr-1"
              @click="scrollSchedule('right')"
            >
              <div class="w-8 h-8 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            <div 
              ref="scheduleContainerRef"
              class="flex overflow-x-auto no-scrollbar pb-4 scroll-smooth"
            >
              <div 
                v-for="(anime, index) in currentDayAnimes" 
                :key="anime.id || index"
                class="flex-shrink-0 relative mr-3 w-64 rounded-lg overflow-hidden transform transition-transform hover:translate-y-[-5px]"
                @click="goToVideoDetail(anime.id)"
              >
                <img 
                  :src="handleImageUrl(anime.cover || '')" 
                  class="w-full h-56 object-cover rounded-lg" 
                  alt="动漫封面" 
                  draggable="false"
                  @error="handleImageError"
                />
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <h3 class="text-white font-medium mb-1 line-clamp-1">{{ anime.title || '未知标题' }}</h3>
                  <div class="text-gray-300 text-sm">{{ anime.episode || '暂无更新' }}</div>
                </div>
              </div>
              
              <!-- 加载状态 -->
              <div v-if="loadingSchedule" class="w-full flex justify-center items-center py-8">
                <img :src="Loading" class="w-20 h-30" alt="加载中" />
              </div>
              
              <!-- 当没有数据时显示提示 -->
              <div v-else-if="currentDayAnimes.length === 0" class="w-full flex justify-center items-center py-8 text-gray-400">
                当天暂无更新的番剧，请查看其他日期
              </div>
              
              <div v-else class="flex-shrink-0 w-10"></div> <!-- 用于在最后添加间距 -->
            </div>
          </div>
        </div>

        <!-- 四月新番 -->
        <div class="px-4 mt-5 pb-16">
          <div class="flex justify-between items-center mb-3">
            <div class="flex items-center">
              <span class="text-amber-400 mr-1">🔥</span>
              <span class="font-medium">四月新番</span>
            </div>
            <span class="text-xs text-gray-500" v-if="newAnimes.length > 0">共{{ newAnimes.length }}部作品</span>
          </div>

          <!-- 新番加载占位 -->
          <div v-if="newAnimes.length === 0" class="py-8 flex justify-center items-center">
            <div class="text-center">
              <div class="loading-spinner mb-2"></div>
              <p class="text-sm text-gray-500">加载中...</p>
            </div>
          </div>

          <!-- 新番列表 -->
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            <div
                v-for="anime in newAnimes"
                :key="anime.id"
                class="rounded-lg overflow-hidden bg-white shadow-sm"
                @click="goToVideoDetail(anime.id)"
            >
              <div class="relative">
                <img 
                  :src="handleImageUrl(anime.cover)" 
                  class="w-full aspect-video object-cover" 
                  alt="封面"
                  @error="handleImageError"
                />
                <span class="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">
                  {{ anime.episode }}
                </span>
              </div>
              <div class="p-2">
                <h3 class="text-sm font-medium line-clamp-1 mb-1">{{ anime.title }}</h3>
                <p class="text-xs text-gray-500 line-clamp-1">{{ anime.categories }}</p>
                <p class="text-xs text-gray-400 mt-1" v-if="anime.updateTime">{{ anime.updateTime }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 番剧标签页内容 - 使用组件 -->
      <AnimeList
        v-else-if="activeTab === '番剧'"
        :anime-list="animeList"
      />

      <!-- 其他标签页内容 -->
      <div v-else class="empty-content">
        <div class="empty-text">{{ activeTab }}内容开发中...</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式 */
.home-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  position: relative;
  overflow-x: hidden;
}

/* 内容区域样式 */
.page-content {
  position: relative;
  z-index: 1;
  width: 100%;
}

/* 快捷分类按钮 */
.category-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.category-btn {
  padding: 12px 0;
  border-radius: 30px; /* 更圆润的圆角 */
  text-align: center;
  color: white;
  font-size: 14px;
  font-weight: 500;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.category-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  z-index: 1;
}

.category-btn span {
  position: relative;
  z-index: 2;
}

.category-btn-blue {
  background: linear-gradient(to right, #00c6fb, #005bea);
}

.category-btn-pink {
  background: linear-gradient(to right, #ff758c, #ff7eb3);
}

.category-btn-purple {
  background: linear-gradient(to right, #7928ca, #ff0080);
}

.category-btn-indigo {
  background: linear-gradient(to right, #3a7bd5, #3a6073);
}

/* 空内容提示 */
.empty-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}

.empty-text {
  color: #999;
  font-size: 16px;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top-color: #3498db;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 隐藏滚动条但保留滚动功能 */
.no-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.no-scrollbar::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

/* 排期表标签容器 */
.schedule-tabs-container {
  display: flex;
  background-color: #f3f4f6;
  border-radius: 9999px;
  padding: 4px;
  justify-content: flex-start;
}

/* 日期标签样式 */
.day-tab {
  color: #4b5563;
  min-width: 50px;
  flex: 0 0 auto;
}

.day-tab:hover {
  background-color: #e5e7eb;
}

.day-tab.active {
  background-color: #ec4899;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transform: scale(1.05);
}

/* 手机端日期标签优化 */
@media (max-width: 480px) {
  .day-tab {
    padding: 4px 8px;
    font-size: 12px;
    min-width: 42px;
  }
  
  .day-tab.active {
    transform: scale(1.03);
  }
}
</style>