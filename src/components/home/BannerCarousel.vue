<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

// 接收轮播图数据作为props
const props = defineProps({
  banners: {
    type: Array,
    default: () => []
  }
})

const router = useRouter()

// 轮播图状态
const swiperCurrentIndex = ref(1)

// 创建一个包含首尾额外项的轮播图数据，用于无缝循环
const loopSwiperImages = computed(() => {
  if (!props.banners || props.banners.length === 0) {
    return []
  }
  // 在数组开始添加最后一项，在数组结束添加第一项
  return [
    { ...props.banners[props.banners.length - 1] },
    ...props.banners,
    { ...props.banners[0] }
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
// 添加一个变量用于跟踪是否有显著的滑动行为
const hasMoved = ref(false)
const clickStartTime = ref(0)

// 轮播图触摸开始
const touchStart = (e) => {
  if (!carouselRef.value) return
  stopAutoplay()
  isDragging.value = true
  hasMoved.value = false
  clickStartTime.value = Date.now()
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
  // 如果移动距离超过5像素，标记为已移动
  if (Math.abs(diff) > 5) {
    hasMoved.value = true
  }
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
    
    // 500ms后重置hasMoved状态，防止干扰下一次点击
    setTimeout(() => {
      hasMoved.value = false
    }, 500)
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
    index = props.banners.length - 1
  } else if (index >= props.banners.length) {
    index = 0
  }
  return index
})

// 初始化和数据变化时重置轮播图
const initCarousel = () => {
  if (props.banners && props.banners.length > 0) {
    // 重置轮播索引到第一张图片(因为loopSwiperImages在第0位是克隆的最后一张)
    swiperCurrentIndex.value = 1
    // 更新位置
    setTimeout(() => {
      if (carouselRef.value) {
        const slideWidth = carouselRef.value.clientWidth
        prevTranslate.value = -swiperCurrentIndex.value * slideWidth
        currentTranslate.value = prevTranslate.value
        carouselRef.value.style.transition = 'none'
        setCarouselPosition()
      }
      // 重启自动播放
      startAutoplay()
    }, 100)
  }
}

// 在轮播图中点击跳转到详情页
const goToVideoDetail = (id, event) => {
  // 如果是拖动操作或有显著移动，不触发跳转
  const clickDuration = Date.now() - clickStartTime.value
  // 如果有明显的滑动或点击时长超过300ms(表示可能是长按或拖动)，不触发点击
  if (hasMoved.value || clickDuration > 300) {
    return
  }
  
  if(id) {
    router.push(`/video/${id}`)
  }
}

onMounted(() => {
  startAutoplay()
  initCarousel()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  stopAutoplay()
  window.removeEventListener('resize', handleResize)
})

// 监听props变化重新初始化
watch(
  () => props.banners,
  () => {
    initCarousel()
  },
  { deep: true }
)
</script>

<template>
  <div class="carousel-container px-4 py-3">
    <div class="carousel-overflow">
      <!-- 无数据或加载中显示占位图 -->
      <div v-if="!loopSwiperImages.length" class="carousel-placeholder">
        <div class="carousel-loading">
          <el-icon class="loading-icon"><svg class="circular" viewBox="25 25 50 50"><circle class="path" cx="50" cy="50" r="20" fill="none"/></svg></el-icon>
          <span>轮播图加载中...</span>
        </div>
      </div>
      <!-- 有数据时显示轮播图 -->
      <div
        v-else
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
          @click="goToVideoDetail(item.id, $event)"
        >
          <img :src="item.url" class="carousel-image" alt="carousel" draggable="false" />
          <div class="carousel-caption">
            <p class="carousel-title">{{ item.title }}</p>
            <p v-if="item.subtitle" class="carousel-subtitle">{{ item.subtitle }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 指示器 - 只有在有图片时才显示 -->
    <div v-if="banners.length > 0" class="carousel-indicators">
      <span
        v-for="(item, index) in banners"
        :key="item.id"
        class="indicator"
        :class="{ 'active': index === currentRealIndex }"
        @click="slideTo(index)"
      ></span>
    </div>
  </div>
</template>

<style scoped>
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

/* 轮播图加载占位符 */
.carousel-placeholder {
  width: 100%;
  height: 180px;
  background-color: #f3f4f6;
  border-radius: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 添加媒体查询，在大屏幕上增加高度 */
@media (min-width: 768px) {
  .carousel-placeholder {
    height: 320px;
  }
}

@media (min-width: 1024px) {
  .carousel-placeholder {
    height: 440px;
  }
}

@media (min-width: 1440px) {
  .carousel-placeholder {
    height: 560px;
  }
}

@media (min-width: 1920px) {
  .carousel-placeholder {
    height: 700px;
  }
}

.carousel-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.loading-icon {
  font-size: 24px;
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.circular {
  height: 24px;
  width: 24px;
  animation: rotating 2s linear infinite;
}

.path {
  stroke: #d1d5db;
  stroke-width: 3;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}

.carousel-track {
  display: flex;
  width: 100%;
  height: 180px;
  will-change: transform;
  transform: translateX(-100%); /* 初始显示真实的第一张图片，也就是loopSwiperImages中的第二个元素 */
}

/* 添加媒体查询，在大屏幕上增加高度 */
@media (min-width: 768px) {
  .carousel-track {
    height: 320px;
  }
}

@media (min-width: 1024px) {
  .carousel-track {
    height: 440px;
  }
}

@media (min-width: 1440px) {
  .carousel-track {
    height: 560px;
  }
}

@media (min-width: 1920px) {
  .carousel-track {
    height: 700px;
  }
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

/* 添加媒体查询，在大屏幕上增加文字大小和内边距 */
@media (min-width: 1024px) {
  .carousel-caption {
    padding: 24px;
  }
  
  .carousel-title {
    font-size: 20px !important;
  }
  
  .carousel-subtitle {
    font-size: 16px !important;
  }
}

@media (min-width: 1440px) {
  .carousel-caption {
    padding: 32px;
  }
  
  .carousel-title {
    font-size: 24px !important;
  }
  
  .carousel-subtitle {
    font-size: 18px !important;
  }
}

.carousel-title {
  color: white;
  font-size: 16px;
  font-weight: 500;
  margin: 0;
}

.carousel-subtitle {
  color: white;
  font-size: 12px;
  font-weight: 400;
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
</style> 