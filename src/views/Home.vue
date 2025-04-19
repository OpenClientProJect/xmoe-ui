<script setup>
import {ref, onMounted, computed} from 'vue'
import {useRouter} from 'vue-router'
// 导入样式
import 'swiper/css'
import 'swiper/css/pagination'
import HeaderNav from "@/components/home/common/HeaderNav.vue";
// 导入番剧列表组件
import AnimeList from '@/components/home/DramaList.vue'
// 导入轮播图组件
import BannerCarousel from '@/components/home/BannerCarousel.vue'
import {getBannerListService} from "@/api/recommend.js";
import {getDramaListService, getDramaScheduleService} from "@/api/anime.js";

const router = useRouter()
const activeTab = ref('推荐')

// 添加番剧数据
const animeList = []

// 模拟追番日历数据
const activeDay = ref(1) // 默认选中周二

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
}

// 模拟四月新番数据
const newAnimes = ref([])

// 轮播图数据
const swiperImages = ref([])

//获取轮播图数据
const getSwiperImages = async () => {
  const res = await getBannerListService()
  console.log('获取轮播图数据:', res)

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
const getDramaSchedule = async () => {
  try {
    const res = await getDramaScheduleService()
    console.log('获取排期表数据:', res)
    
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
      
      // 如果当前选择的日期没有数据但其他日期有，自动跳转到有数据的日期
      if (calendarByDay.value[activeDay.value].length === 0) {
        for (let i = 0; i < 7; i++) {
          if (calendarByDay.value[i].length > 0) {
            activeDay.value = i
            break
          }
        }
      }
  } catch (error) {
    console.error('获取排期表数据失败:', error)
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
}

// 在轮播图中点击跳转到详情页
const goToVideoDetail = (id) => {
  if (id) {
    router.push(`/video/${id}`)
  }
}
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航容器 - 使用fixed定位 -->
    <div class="page-header">
      <!-- 顶部搜索栏和导航栏 -->
      <HeaderNav
          :tabs="['推荐', '番剧', '剧场版', '4K', '待添加']"
          :active-tab="activeTab"
          @tab-change="handleTabChange"
      />
    </div>

    <!-- 内容区域 - 添加足够的上边距避免被顶部遮挡 -->
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
          <div class="category-btn category-btn-pink">
            <span>榜单</span>
          </div>
          <div class="category-btn category-btn-purple">
            <span>海贼王</span>
          </div>
          <div class="category-btn category-btn-indigo">
            <span>追番</span>
          </div>
        </div>

        <!-- 追番日历 -->
        <div class="px-4 mt-5">
          <div class="flex justify-between items-center mb-4">
            <div class="flex items-center">
              <h2 class="text-xl font-bold mr-4">排期表</h2>
              <!-- 周一至周日标签栏 -->
              <div class="flex overflow-x-auto no-scrollbar py-2">
                <div
                    v-for="(day, index) in ['周一', '周二', '周三', '周四', '周五', '周六', '周日']"
                    :key="index"
                    class="mx-2 first:ml-3 last:mr-3 text-sm font-medium whitespace-nowrap cursor-pointer px-3 py-1 rounded-full"
                    :class="index === activeDay.value ? 
                      'bg-pink-500 text-white' : 
                      'text-gray-700 hover:bg-gray-100'"
                    @click="switchDay(index)"
                >
                  {{ day }}
                  <span v-if="calendarByDay && calendarByDay.value && calendarByDay.value[index] && calendarByDay.value[index].length > 0" class="ml-1 text-xs">
                    ({{ calendarByDay.value[index].length }})
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 动漫卡片轮播 - 横向滑动 -->
          <div class="relative">
            <div class="flex overflow-x-auto no-scrollbar pb-4">
              <div 
                v-for="(anime, index) in currentDayAnimes" 
                :key="anime.id || index"
                class="flex-shrink-0 relative mr-3 w-64 rounded-lg overflow-hidden"
                @click="goToVideoDetail(anime.id)"
              >
                <img :src="anime.cover || ''" class="w-full h-56 object-cover rounded-lg" alt="动漫封面"/>
                <div class="absolute top-2 left-2 px-2 py-1 text-xs text-white rounded-md"
                     :class="{'bg-green-500': index % 3 === 0, 'bg-pink-500': index % 3 === 1, 'bg-red-500': index % 3 === 2}">
                  {{ anime.year || '2025' }}
                </div>
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <h3 class="text-white font-medium mb-1 line-clamp-1">{{ anime.title || '未知标题' }}</h3>
                  <div class="text-gray-300 text-sm">{{ anime.episode || '暂无更新' }}</div>
                </div>
              </div>
              
              <!-- 当没有数据时显示提示 -->
              <div v-if="currentDayAnimes.length === 0" class="w-full flex justify-center items-center py-8 text-gray-400">
                当天暂无更新的番剧，请查看其他日期
              </div>
              
              <div v-else class="flex-shrink-0 w-10"></div> <!-- 用于在最后添加间距 -->
            </div>
            
            <!-- 右侧滚动箭头，仅在有数据时显示 -->
            <div v-if="currentDayAnimes.length > 0" class="absolute right-0 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center cursor-pointer z-10">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
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
          <div v-else class="grid grid-cols-2 gap-3">
            <div
                v-for="anime in newAnimes"
                :key="anime.id"
                class="rounded-lg overflow-hidden bg-white shadow-sm"
                @click="goToVideoDetail(anime.id)"
            >
              <div class="relative">
                <img :src="anime.cover" class="w-full aspect-video object-cover" alt="封面"/>
                <span class="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">{{
                    anime.episode
                  }}</span>
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

/* 顶部固定导航 */
.page-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}

/* 内容区域样式 */
.page-content {
  padding-top: 106px; /* 顶部导航高度 + 额外空间 */
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
</style>