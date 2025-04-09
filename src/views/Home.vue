<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const activeTab = ref('推荐')

const tabs = ['推荐', '番剧', '剧场版', '4K', '待添加']
const userInfo = {
  avatar: 'https://avatars.githubusercontent.com/u/156616301?v=4'
}
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
const newAnimes = [
  {
    id: 7,
    title: '某新番剧1',
    episode: '更新至01集',
    cover: 'https://placeholder.pics/svg/160x90/DEDEDE/555555/封面1'
  },
  {
    id: 8,
    title: '某新番剧2',
    episode: '更新至01集',
    cover: 'https://placeholder.pics/svg/160x90/DEDEDE/555555/封面2'
  }
]

// 模拟轮播图数据
const swiperImages = [
  {
    id: 100,
    url: 'https://img.cycimg.me/r/800/pic/cover/l/23/ce/363957_pgptl.jpg',
    title: '快藏起来！玛琪娜同学！'
  },
  {
    id: 101,
    url: 'https://img.cycimg.me/r/800/pic/cover/l/9e/b3/486347_jKVqi.jpg',
    title: '庙屋少女'
  }
]

const goToSearch = () => {
  router.push('/search')
}
</script>

<template>
  <div class="home-container">
    <!-- 顶部导航容器 - 使用fixed定位 -->
    <div class="page-header">
      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <div class="avatar-container">
          <img :src="userInfo.avatar" class="avatar-img" alt="avatar" />
        </div>
        
        <div class="search-input" @click="goToSearch">
          <img src="@/assets/icon/search.svg" class="search-icon" alt="search" />
          <span class="placeholder-text">搜索</span>
        </div>
        
        <img src="@/assets/icon/Recording.svg" class="action-icon recording-icon" alt="recording" />
        <el-icon class="action-icon history-icon"><el-icon-clock /></el-icon>
        <el-icon class="action-icon more-icon"><el-icon-more-filled /></el-icon>
      </div>
      
      <!-- 分类导航栏 -->
      <div class="tab-container">
        <div 
          v-for="tab in tabs" 
          :key="tab" 
          class="tab-item"
          :class="{'active-tab': activeTab === tab}"
          @click="activeTab = tab"
        >
          {{ tab }}
        </div>
      </div>
    </div>

    <!-- 内容区域 - 添加足够的上边距避免被顶部遮挡 -->
    <div class="page-content">
      <!-- 轮播图 -->
      <div class="px-4 py-3">
        <el-carousel
          height="180px"
          indicator-position="none"
          class="carousel-container"
          :autoplay="true"
          :interval="5000"
          :loop="true"
          arrow="never"
          direction="horizontal"
        >
          <el-carousel-item 
            v-for="item in swiperImages" 
            :key="item.id"
            class="carousel-item"
          >
            <div class="carousel-content">
              <img :src="item.url" class="carousel-image" />
              <div class="carousel-caption">
                <p class="carousel-title">{{ item.title }}</p>
              </div>
            </div>
          </el-carousel-item>
        </el-carousel>
      </div>

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
            <el-icon class="mr-1"><el-icon-calendar /></el-icon>
            <span class="font-medium">追番日历</span>
          </div>
          <span class="text-gray-400 text-sm">更多</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- 左侧日历 -->
          <div class="bg-cover bg-center rounded-lg p-2" style="background-image: url('https://placeholder.pics/svg/180x300/333333/FFFFFF/背景');">
            <div v-for="anime in calendarAnimes" :key="anime.id" class="flex items-center mb-3 bg-black/30 rounded-lg p-2">
              <img :src="anime.cover" class="w-12 h-16 object-cover rounded" />
              <div class="ml-2 text-white">
                <p class="text-xs font-medium line-clamp-1">{{ anime.title }}</p>
                <p class="text-xs opacity-70 mt-1">{{ anime.updateTime }}</p>
              </div>
            </div>
          </div>

          <!-- 右侧日历 -->
          <div class="bg-cover bg-center rounded-lg p-2" style="background-image: url('https://placeholder.pics/svg/180x300/666666/FFFFFF/背景');">
            <div v-for="anime in rightCalendarAnimes" :key="anime.id" class="flex items-center mb-3 bg-black/30 rounded-lg p-2">
              <img :src="anime.cover" class="w-12 h-16 object-cover rounded" />
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
          <span class="text-green-500 text-sm">颜北女角太多了！</span>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div v-for="anime in newAnimes" :key="anime.id" class="rounded-lg overflow-hidden">
            <div class="relative">
              <img :src="anime.cover" class="w-full h-auto" />
              <span class="absolute bottom-1 right-1 text-xs text-white bg-black/50 px-1 rounded">{{ anime.episode }}</span>
            </div>
          </div>
        </div>
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
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  /* 硬件加速，减少抖动 */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

/* 搜索栏样式 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background-image: linear-gradient(to right, #ff6b8b, #ff8e72);
}

.avatar-container {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  padding: 6px 16px;
  cursor: pointer;
}

.search-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.placeholder-text {
  color: #9ca3af;
}

.action-icon {
  margin-left: 12px;
  color: white;
}

.history-icon {
  color: white;
}

.more-icon {
  color: white;
}

.recording-icon {
  width: 24px;
  height: 24px;
  margin-left: 12px;
  cursor: pointer;
  filter: brightness(0) invert(1); /* 将图标改为白色 */
}

/* 标签栏样式 */
.tab-container {
  display: flex;
  overflow-x: auto;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  padding: 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.tab-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}

.tab-item {
  padding: 12px 16px;
  font-size: 14px;
  white-space: nowrap;
  position: relative;
  color: #333;
}

.active-tab {
  color: #dc2626;
  font-weight: 600;
  border-bottom: 2px solid #dc2626;
}

/* 内容区域样式 */
.page-content {
  padding-top: 106px; /* 顶部导航高度 + 额外空间 */
  position: relative;
  z-index: 1;
  width: 100%;
}

/* 轮播图样式 */
.carousel-container {
  border-radius: 8px;
  overflow: hidden;
  touch-action: pan-y;
}

.carousel-item {
  height: 100%;
}

.carousel-content {
  position: relative;
  height: 100%;
  width: 100%;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 16px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  width: 100%;
}

.carousel-title {
  color: white;
  font-size: 18px;
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
</style> 