<script setup>
import {ref, onMounted} from 'vue'
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
import {getDramaListService} from "@/api/anime.js";

const router = useRouter()
const activeTab = ref('推荐')

// 添加番剧数据
const animeList = [
  {
    id: 201,
    title: '香格里拉边境',
    episodes: '全25集',
    cover: 'https://img.cycimg.me/r/800/pic/cover/l/23/ce/363957_pgptl.jpg'
  },
  {
    id: 202,
    title: '命运-奇异夜谈',
    episodes: '全1集',
    cover: 'https://img.cycimg.me/r/800/pic/cover/l/9e/b3/486347_jKVqi.jpg'
  },
  {
    id: 203,
    title: '光之美少女',
    episodes: '全49集',
    cover: 'https://img.cycimg.me/r/800/pic/cover/l/9e/fa/509297_Cnz9B.jpg'
  },
  {
    id: 204,
    title: '最强王者，无所事事',
    episodes: '更新至第02集',
    cover: 'https://img.cycimg.me/r/800/pic/cover/l/23/ce/363957_pgptl.jpg'
  },
  {
    id: 205,
    title: '外星人沐沐',
    episodes: '更新至第01集',
    cover: 'https://img.cycimg.me/r/800/pic/cover/l/9e/b3/486347_jKVqi.jpg'
  },
  {
    id: 206,
    title: '圣女因太过诚实',
    episodes: '更新至第02集',
    cover: 'https://img.cycimg.me/r/800/pic/cover/l/9e/fa/509297_Cnz9B.jpg'
  },
  {
    id: 207,
    title: '记忆缝线',
    episodes: '更新至第02集',
    cover: 'https://img.cycimg.me/r/800/pic/cover/l/23/ce/363957_pgptl.jpg'
  },
  {
    id: 208,
    title: '鹰峰同学请睁开衣领',
    episodes: '更新至第02集',
    cover: 'https://img.cycimg.me/r/800/pic/cover/l/9e/b3/486347_jKVqi.jpg'
  },
  {
    id: 209,
    title: '直至魔女消逝',
    episodes: '更新至第02集',
    cover: 'https://img.cycimg.me/r/800/pic/cover/l/9e/fa/509297_Cnz9B.jpg'
  }
]

// 模拟追番日历数据
const calendarAnimes = [
  {
    id: 1,
    title: '夏日口袋',
    updateTime: '（每周一）22:30更新',
    cover: 'https://placeholder.pics/svg/80x120/DEDEDE/555555/封面'
  },
  {
    id: 2,
    title: '东旅-ThatJourney-',
    updateTime: '（每周一）22:30更新',
    cover: 'https://placeholder.pics/svg/80x120/DEDEDE/555555/封面'
  },
  {
    id: 3,
    title: '测不准的阿波连同学 第二季',
    updateTime: '（每周一）21:30更新',
    cover: 'https://placeholder.pics/svg/80x120/DEDEDE/555555/封面'
  },
  {
    id: 4,
    title: '快藏起来！玛琪娜同学！',
    updateTime: '（每周一）01:00更新',
    cover: 'https://placeholder.pics/svg/80x120/DEDEDE/555555/封面'
  }
]

// 右侧日历数据
const rightCalendarAnimes = [
  {
    id: 5,
    title: '记忆链接',
    updateTime: '（每周二）23:45更新',
    cover: 'https://placeholder.pics/svg/80x120/DEDEDE/555555/封面'
  },
  {
    id: 6,
    title: '鹰峰同学请睁上衣领',
    updateTime: '（每周二）23:00更新',
    cover: 'https://placeholder.pics/svg/80x120/DEDEDE/555555/封面'
  }
]

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

onMounted(() => {
  getSwiperImages()

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
        <div class="px-4 mt-4">
          <div class="flex justify-between items-center mb-2">
            <div class="flex items-center">
              <el-icon class="mr-1">
                <el-icon-calendar/>
              </el-icon>
              <span class="font-medium">追番日历</span>
            </div>
            <span class="text-gray-400 text-sm">更多</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- 左侧日历 -->
            <div class="bg-cover bg-center rounded-lg p-2"
                 style="background-image: url('https://placeholder.pics/svg/180x300/333333/FFFFFF/背景');">
              <div v-for="anime in calendarAnimes" :key="anime.id"
                   class="flex items-center mb-3 bg-black/30 rounded-lg p-2">
                <img :src="anime.cover" class="w-12 h-16 object-cover rounded"/>
                <div class="ml-2 text-white">
                  <p class="text-xs font-medium line-clamp-1">{{ anime.title }}</p>
                  <p class="text-xs opacity-70 mt-1">{{ anime.updateTime }}</p>
                </div>
              </div>
            </div>

            <!-- 右侧日历 -->
            <div class="bg-cover bg-center rounded-lg p-2"
                 style="background-image: url('https://placeholder.pics/svg/180x300/666666/FFFFFF/背景');">
              <div v-for="anime in rightCalendarAnimes" :key="anime.id"
                   class="flex items-center mb-3 bg-black/30 rounded-lg p-2">
                <img :src="anime.cover" class="w-12 h-16 object-cover rounded"/>
                <div class="ml-2 text-white">
                  <p class="text-xs font-medium line-clamp-1">{{ anime.title }}</p>
                  <p class="text-xs opacity-70 mt-1">{{ anime.updateTime }}</p>
                </div>
              </div>
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
</style>