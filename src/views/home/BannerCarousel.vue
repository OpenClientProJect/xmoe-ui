<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { handleImageUrl, handleImageError } from '@/utils/imageUtils' // 导入图片工具类函数

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
// 跟踪滑动距离
const dragDistance = ref(0) 
// 点击相关控制变量
const clickEnabled = ref(true)

// 维护点击状态的变量
let dragStartTime = 0
let isDragEvent = false

// 专门用于处理点击事件的函数
const handleBannerClick = (id) => {
  // 如果点击当前处于禁用状态，不执行操作
  if (!clickEnabled.value) return
  
  // 如果有有效ID，进行跳转
  if (id) {
    router.push(`/video/${id}`)
  }
}

// 轮播图触摸开始
const touchStart = (e) => {
  if (!carouselRef.value) return
  
  stopAutoplay()
  isDragging.value = true
  isDragEvent = false
  dragDistance.value = 0
  dragStartTime = Date.now()
  
  // 重置点击状态
  clickEnabled.value = true
  
  startX.value = getPositionX(e)
  carouselRef.value.style.transition = 'none'
}

// 轮播图触摸移动
const touchMove = (e) => {
  if (!isDragging.value || !carouselRef.value) return
  
  const currentX = getPositionX(e)
  const diff = currentX - startX.value
  
  // 更新拖动距离
  dragDistance.value = Math.abs(diff)
  
  // 如果移动距离超过阈值，标记为拖动事件并禁用点击
  if (dragDistance.value > 10) {
    isDragEvent = true
    clickEnabled.value = false
  }
  
  currentTranslate.value = prevTranslate.value + diff
  setCarouselPosition()
}

// 轮播图触摸结束
const touchEnd = (e) => {
  if (!isDragging.value || !carouselRef.value) return
  isDragging.value = false
  
  // 计算拖动时长
  const dragDuration = Date.now() - dragStartTime
  
  // 短时间内的小距离移动被视为点击
  if (dragDistance.value < 10 && dragDuration < 300) {
    // 允许后续点击事件处理
    clickEnabled.value = true
  } else {
    // 这是一个拖动操作，执行轮播逻辑
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
      
      if (carouselRef.value) {
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
      }
      
      // 重置点击状态
      nextTick(() => {
        clickEnabled.value = true
      })
    }, 300)
  }
  
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
        @touchstart="touchStart"
        @touchmove="touchMove"
        @touchend="touchEnd"
        @touchcancel="touchEnd"
      >
        <div
          v-for="(item, index) in loopSwiperImages"
          :key="`${item.id}-${index}`"
          class="carousel-slide"
        >
          <!-- 添加一个独立的点击区域按钮 -->
          <div class="carousel-click-area" @click="handleBannerClick(item.id)"></div>
          <img 
            :src="handleImageUrl(item.url)" 
            class="carousel-image" 
            alt="carousel" 
            draggable="false" 
            @error="handleImageError" />
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
  -webkit-tap-highlight-color: transparent; /* 去除移动端点击高亮 */
  touch-action: pan-y; /* 允许垂直滚动，但优化水平滑动体验 */
}

/* 添加点击区域样式 */
.carousel-click-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  cursor: pointer;
  background-color: transparent;
  /* 针对移动设备的优化 */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}

/* 增加活跃态样式，提高用户体验 */
.carousel-click-area:active {
  background-color: rgba(0, 0, 0, 0.05); /* 轻微的点击反馈 */
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
  -webkit-tap-highlight-color: transparent; /* 去除移动端点击高亮 */
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none; /* 防止图片被单独点击和拖动 */
}

.carousel-caption {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  pointer-events: none; /* 防止文字干扰点击事件 */
  z-index: 5;
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