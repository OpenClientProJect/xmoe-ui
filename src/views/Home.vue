<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
// 导入样式
import 'swiper/css'
import 'swiper/css/pagination'
import HeaderNav from "@/components/home/common/HeaderNav.vue";
// 导入番剧列表组件
import AnimeList from '@/components/home/DramaList.vue'

const router = useRouter()
const activeTab = ref('推荐')

// 轮播图状态
const swiperCurrentIndex = ref(1)


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
    title: '第一张轮播图'
  },
  {
    id: 101,
    url: 'https://img.cycimg.me/r/800/pic/cover/l/9e/b3/486347_jKVqi.jpg',
    title: '第二张轮播图'
  },
  {
    id: 102,
    url: 'https://img.cycimg.me/r/800/pic/cover/l/23/ce/363957_pgptl.jpg',
    title: '第三张轮播图'
  },
  {
    id: 103,
    url: 'https://img.cycimg.me/r/800/pic/cover/l/9e/b3/486347_jKVqi.jpg',
    title: '第四张轮播图'
  },
  {
    id: 104,
    url: 'https://img.cycimg.me/r/800/pic/cover/l/9e/fa/509297_Cnz9B.jpg',
    title: '第五张轮播图'
  },
]

// 创建一个包含首尾额外项的轮播图数据，用于无缝循环
const loopSwiperImages = computed(() => {
  // 在数组开始添加最后一项，在数组结束添加第一项
  return [
    { ...swiperImages[swiperImages.length - 1] },
    ...swiperImages,
    { ...swiperImages[0] }
  ]
})

// 轮播图相关
const carouselRef = ref(null)
const autoplayTimer = ref(null)
const isDragging = ref(false)
const startX = ref(0)
const currentTranslate = ref(0)
const prevTranslate = ref(0)
const isTransitioning = ref(false)

// 轮播图触摸开始
const touchStart = (e) => {
  if (!carouselRef.value) return
  stopAutoplay()
  isDragging.value = true
  startX.value = getPositionX(e)
  carouselRef.value.style.transition = 'none'
  // 阻止事件冒泡和默认行为，防止页面滚动
  if (e.type.includes('touch')) {
    e.preventDefault()
  }
}

// 轮播图触摸移动
const touchMove = (e) => {
  if (!isDragging.value || !carouselRef.value) return
  // 阻止事件冒泡和默认行为，防止页面滚动
  if (e.type.includes('touch')) {
    e.preventDefault()
  }
  const currentX = getPositionX(e)
  const diff = currentX - startX.value
  currentTranslate.value = prevTranslate.value + diff
  setCarouselPosition()
}

// 轮播图触摸结束
const touchEnd = () => {
  if (!isDragging.value || !carouselRef.value) return
  isDragging.value = false

  const threshold = window.innerWidth * 0.2 // 20%的屏幕宽度作为阈值
  const slideWidth = carouselRef.value.clientWidth

  // 根据拖动距离决定是否切换幻灯片
  if (currentTranslate.value < prevTranslate.value - threshold) {
    // 向左拖动，显示下一张
    swiperCurrentIndex.value += 1
  } else if (currentTranslate.value > prevTranslate.value + threshold) {
    // 向右拖动，显示上一张
    swiperCurrentIndex.value -= 1
  }

  // 更新位置
  prevTranslate.value = -swiperCurrentIndex.value * slideWidth
  currentTranslate.value = prevTranslate.value

  // 添加过渡效果并更新位置
  carouselRef.value.style.transition = 'transform 0.3s ease-out'
  setCarouselPosition()

  // 处理循环逻辑
  isTransitioning.value = true

  // 等待过渡结束后检查是否需要重置位置
  setTimeout(() => {
    isTransitioning.value = false

    // 如果滑动到了复制的第一张（也就是最后一个位置）
    if (swiperCurrentIndex.value >= loopSwiperImages.value.length - 1) {
      carouselRef.value.style.transition = 'none'
      swiperCurrentIndex.value = 1
      prevTranslate.value = -swiperCurrentIndex.value * slideWidth
      currentTranslate.value = prevTranslate.value
      setCarouselPosition()
    }

    // 如果滑动到了复制的最后一张（也就是第一个位置）
    if (swiperCurrentIndex.value <= 0) {
      carouselRef.value.style.transition = 'none'
      swiperCurrentIndex.value = loopSwiperImages.value.length - 2
      prevTranslate.value = -swiperCurrentIndex.value * slideWidth
      currentTranslate.value = prevTranslate.value
      setCarouselPosition()
    }
  }, 300)

  // 恢复自动播放
  startAutoplay()
}

// 获取水平位置
const getPositionX = (e) => {
  return e.type.includes('mouse') ? e.pageX : e.touches[0].pageX
}

// 设置轮播图位置
const setCarouselPosition = () => {
  if (carouselRef.value) {
    carouselRef.value.style.transform = `translateX(${currentTranslate.value}px)`
  }
}

// 跳转到指定幻灯片
const slideTo = (index) => {
  if (!carouselRef.value || isTransitioning.value) return
  stopAutoplay()

  // 将实际索引转换为循环数组索引（加1，因为第0项是克隆的最后一项）
  swiperCurrentIndex.value = index + 1

  const slideWidth = carouselRef.value.clientWidth
  prevTranslate.value = -swiperCurrentIndex.value * slideWidth
  currentTranslate.value = prevTranslate.value

  carouselRef.value.style.transition = 'transform 0.3s ease-out'
  setCarouselPosition()

  startAutoplay()
}

// 自动轮播
const startAutoplay = () => {
  stopAutoplay()
  autoplayTimer.value = setInterval(() => {
    if (!carouselRef.value || isTransitioning.value) return

    swiperCurrentIndex.value += 1

    const slideWidth = carouselRef.value.clientWidth
    prevTranslate.value = -swiperCurrentIndex.value * slideWidth
    currentTranslate.value = prevTranslate.value

    carouselRef.value.style.transition = 'transform 0.3s ease-out'
    setCarouselPosition()

    // 处理循环逻辑
    isTransitioning.value = true

    // 等待过渡结束后检查是否需要重置位置
    setTimeout(() => {
      isTransitioning.value = false

      if (swiperCurrentIndex.value >= loopSwiperImages.value.length - 1) {
        carouselRef.value.style.transition = 'none'
        swiperCurrentIndex.value = 1
        prevTranslate.value = -swiperCurrentIndex.value * slideWidth
        currentTranslate.value = prevTranslate.value
        setCarouselPosition()
      }
    }, 300)
  }, 5000)
}

// 停止自动轮播
const stopAutoplay = () => {
  if (autoplayTimer.value) {
    clearInterval(autoplayTimer.value)
    autoplayTimer.value = null
  }
}

// 窗口大小变化时重置轮播图位置
const handleResize = () => {
  if (!carouselRef.value) return

  const slideWidth = carouselRef.value.clientWidth
  prevTranslate.value = -swiperCurrentIndex.value * slideWidth
  currentTranslate.value = prevTranslate.value

  setCarouselPosition()
}

// 获取当前展示的幻灯片真实索引（用于指示器展示）
const currentRealIndex = computed(() => {
  // 索引需要减1，因为我们在数组前面添加了一个元素
  let index = swiperCurrentIndex.value - 1
  // 处理边界情况
  if (index < 0) {
    index = swiperImages.length - 1
  } else if (index >= swiperImages.length) {
    index = 0
  }
  return index
})

onMounted(() => {
  startAutoplay()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopAutoplay()
  window.removeEventListener('resize', handleResize)
})

// 处理标签切换事件
const handleTabChange = (tab) => {
  activeTab.value = tab
  console.log('切换到标签:', tab)
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
        <!-- 自定义轮播图 -->
        <div class="carousel-container px-4 py-3">
          <div class="carousel-overflow">
            <div
              ref="carouselRef"
              class="carousel-track"
              @mousedown="touchStart"
              @mousemove="touchMove"
              @mouseup="touchEnd"
              @mouseleave="touchEnd"
              @touchstart.prevent="touchStart"
              @touchmove.prevent="touchMove"
              @touchend="touchEnd"
              @touchcancel="touchEnd"
            >
              <div
                v-for="(item, index) in loopSwiperImages"
                :key="`${item.id}-${index}`"
                class="carousel-slide"
              >
                <img :src="item.url" class="carousel-image" alt="carousel" draggable="false" />
                <div class="carousel-caption">
                  <p class="carousel-title">{{ item.title }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 指示器 -->
          <div class="carousel-indicators">
            <span
              v-for="(item, index) in swiperImages"
              :key="item.id"
              class="indicator"
              :class="{ 'active': index === currentRealIndex }"
              @click="slideTo(index)"
            ></span>
          </div>
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

/* 自定义轮播图样式 */
.carousel-container {
  position: relative;
  width: 100%;
  padding-bottom: 24px;
}

.carousel-overflow {
  overflow: hidden;
  width: 100%;
  border-radius: 12px;
  position: relative;
}

.carousel-track {
  display: flex;
  width: 100%;
  height: 180px;
  will-change: transform;
  transform: translateX(-100%); /* 初始显示真实的第一张图片，也就是loopSwiperImages中的第二个元素 */
}

.carousel-slide {
  flex: 0 0 100%;
  min-width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  /* 添加指针效果，表示可点击 */
  cursor: pointer;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  -webkit-user-drag: none;
  user-select: none;
}

.carousel-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}

.carousel-title {
  color: white;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  margin-top: 12px;
  gap: 6px;
}

.indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  cursor: pointer;
}

.indicator.active {
  width: 18px;
  border-radius: 3px;
  background-color: #ff6b8b;
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
</style>