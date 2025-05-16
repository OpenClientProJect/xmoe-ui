<script setup>
import { ref, onMounted, watch, computed, nextTick, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDramaListService } from '@/api/Drama.js'
import { getSubMenuListService } from '@/api/home/anime.js'
import { handleImageUrl, handleImageError } from '@/utils/imageUtils.js'
import Loading from '@/assets/gif/loading.gif'

const route = useRoute()
const router = useRouter()

// 状态变量
const movieList = ref([])
const originalMovieList = ref([]) // 用于本地筛选的原始数据
const isLoading = ref(false)
const isEmpty = ref(false)
const activeTab = ref('剧场版')

// 分页相关
const currentPage = ref(1)
const hasMore = ref(true)
const isLoadingMore = ref(false)
// 滚动锁定标志，防止重复触发加载
const scrollLocked = ref(false)
// 数据渲染状态
const isDataRendering = ref(false)

// 当前查询参数
const currentQueryParams = ref({})

// 分类标签数据
const tagData = ref({})

// 当前选中的标签值（每行一个）
const selectedTags = ref({
  0: '全部', // 类型
  1: '全部', // 地区
  2: '全部', // 语言
  3: '全部', // 年份
  4: '时间'  // 排序（默认按时间）
})

// 排序选项
const sortOptions = [
  { label: '时间', value: 'updateTime' },
  { label: '播放', value: 'hot' },
  { label: '评分', value: 'score' }
]

// 标签行配置
const tagRows = computed(() => [
  { 
    id: 0, 
    type: 'class', 
    title: '类型',
    tags: tagData.value.class ? ['全部', ...tagData.value.class.split(',')] : ['全部']
  },
  { 
    id: 1, 
    type: 'area', 
    title: '地区',
    tags: tagData.value.area ? ['全部', ...tagData.value.area.split(',')] : ['全部']
  },
  {
    id: 2,
    type: 'lang',
    title: '语言',
    tags: tagData.value.lang ? ['全部', ...tagData.value.lang.split(',')] : ['全部']
  },
  { 
    id: 3, 
    type: 'year', 
    title: '年份',
    tags: tagData.value.year ? ['全部', ...tagData.value.year.split(',')] : ['全部']
  },
  {
    id: 4,
    type: 'sort',
    title: '排序',
    tags: sortOptions.map(option => option.label)
  }
])

// 处理图片加载完成事件
const handleImageLoaded = (event) => {
  event.target.classList.add('loaded')
  // 移除loading类
  event.target.classList.remove('loading')
  
  // 图片加载完成计数
  loadedImagesCount++
  if (isDataRendering.value && loadedImagesCount >= totalNewImages.value * 0.7) {
    // 当70%的图片加载完成时，认为渲染已经基本完成
    isDataRendering.value = false
  }
}

// 图片加载完成计数
let loadedImagesCount = 0
const totalNewImages = ref(0)

// 监听movieList变化，重置图片加载计数器
watch(() => movieList.value.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    // 有新数据添加
    loadedImagesCount = 0
    totalNewImages.value = newLength - oldLength
  }
})

// 处理图片加载开始事件
const handleImageLoading = (event) => {
  // 添加loading类以显示加载动画
  event.target.classList.add('loading')
}

// 获取剧场版列表数据
const getMovieList = async (params = {}, isAppend = false) => {
  try {
    if (!isAppend) {
      // 初始加载时显示加载状态
      isLoading.value = true
      isEmpty.value = false
      // 重置分页
      currentPage.value = 1
      hasMore.value = true
      // 保存当前查询参数
      currentQueryParams.value = {...params}
    }
    
    // 构建请求参数
    const queryParams = {
      typeId: params.typeId || 2, // 默认使用剧场版的typeId
      page: currentPage.value,
      limit: 18,
      ...params
    }
    
    const res = await getDramaListService(queryParams)
    
    // 设置数据正在渲染中
    isDataRendering.value = true
    
    let newData = []
    
    if (res.code === 200 && Array.isArray(res.data)) {
      // 处理电影数据，确保图片URL正确
      newData = res.data.map(movie => ({
        ...movie,
        // 使用handleImageUrl处理图片URL防盗链问题
        processedCover: handleImageUrl(movie.cover || movie.vod_pic)
      }))
      
      // 判断是否还有更多数据
      if (newData.length === 0) {
        hasMore.value = false
      }
      
      if (isAppend) {
        // 追加模式，把新数据添加到现有列表
        movieList.value = [...movieList.value, ...newData]
        // 更新原始数据集
        originalMovieList.value = [...originalMovieList.value, ...newData]
      } else {
        // 非追加模式，替换现有列表
        movieList.value = newData
        originalMovieList.value = [...newData]
        isEmpty.value = newData.length === 0
      }
      
      // 使用nextTick等待DOM更新完成
      await nextTick()
      
      // 给图片加载一些额外时间
      setTimeout(() => {
        isDataRendering.value = false
      }, 500)
      
    } else {
      console.error('获取剧场版列表失败:', res.message || '未知错误')
      if (!isAppend) {
        isEmpty.value = true
      }
      hasMore.value = false
    }
  } catch (error) {
    console.error('获取剧场版列表错误:', error)
    if (!isAppend) {
      isEmpty.value = true
    }
    throw error
  } finally {
    // 只有在非追加模式下才重置加载状态
    if (!isAppend) {
      isLoading.value = false
    }
  }
}

// 加载更多数据
const loadMoreData = async () => {
  if (isLoading.value || isLoadingMore.value || !hasMore.value) return
  
  isLoadingMore.value = true
  
  // 增加页码
  currentPage.value += 1

  try {
    await getMovieList(currentQueryParams.value, true)
  } catch (error) {
    currentPage.value -= 1
  } finally {
    setTimeout(() => {
      isLoadingMore.value = false
    }, 300)
  }
}

// 监听滚动事件，检测是否滚动到底部
const handleScroll = () => {
  // 如果正在加载，或者没有更多数据，或者滚动已锁定，或者数据正在渲染中，则不处理
  if (isLoading.value || isLoadingMore.value || !hasMore.value || scrollLocked.value || isDataRendering.value) return
  
  const scrollHeight = document.documentElement.scrollHeight
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const clientHeight = document.documentElement.clientHeight
  
  // 当距离底部50px时提前加载
  if (scrollHeight - scrollTop - clientHeight < 50) {
    // 锁定滚动，防止多次触发
    scrollLocked.value = true
    loadMoreData()
    
    // 1秒后解锁滚动
    setTimeout(() => {
      scrollLocked.value = false
    }, 1000)
  }
}

// 处理标签切换
const handleTabChange = (tab) => {
  activeTab.value = tab
  // 向父组件(HomeLayout)发送tab-change事件
  emit('tab-change', tab)
}

// 定义emit
const emit = defineEmits(['tab-change'])

// 监听路由参数变化，重新获取数据
watch(() => route.query.typeId, (newTypeId) => {
  const params = { typeId: newTypeId || 2 }
  currentQueryParams.value = params
  getMovieList(params)
}, { immediate: true })

// 获取排序参数值
const getSortValue = (sortLabel) => {
  const option = sortOptions.find(opt => opt.label === sortLabel)
  return option ? option.value : 'updateTime'
}

// 选择标签
const selectTag = (rowId, tag) => {
  selectedTags.value[rowId] = tag
  
  // 构建查询参数，基于当前的查询参数
  const params = { ...currentQueryParams.value }
  
  // 重置分页
  currentPage.value = 1
  hasMore.value = true
  
  // 类型筛选
  if (rowId === 0) {
    if (tag !== '全部') {
      // 本地筛选vod_class包含所选标签的剧场版
      movieList.value = originalMovieList.value.filter(movie => {
        if (!movie.vod_class) return false
        const classes = movie.vod_class.split(',')
        return classes.includes(tag)
      })
      return; // 只有在本地筛选时才return，不请求API
    }
    // 选择全部时，继续执行后续代码，不return
  }
  
  // 地区筛选
  if (rowId === 1) {
    if (tag === '全部') {
      // 如果选择了全部，删除对应参数
      delete params.area
    } else {
      params.area = tag
    }
  }
  
  // 语言筛选
  if (rowId === 2) {
    if (tag === '全部') {
      // 如果选择了全部，删除对应参数
      delete params.lang
    } else {
      params.lang = tag
    }
  }
  
  // 年份筛选
  if (rowId === 3) {
    if (tag === '全部') {
      // 如果选择了全部，删除对应参数
      delete params.year
    } else {
      params.year = tag
    }
  }
  
  // 排序选项
  if (rowId === 4) {
    params.type = getSortValue(tag)
  }
  
  // 保存当前typeId参数
  if (route.query.typeId) {
    params.typeId = route.query.typeId
  } else {
    // 确保有默认的typeId
    params.typeId = params.typeId || 2
  }
  
  // 更新当前查询参数
  currentQueryParams.value = params
  
  // 调用API重新获取数据，不再检查参数长度
  getMovieList(params)
}

// 获取子分类标签
const getMovieTags = async () => {
  try {
    // 获取剧场版的子分类数据（typeId为2表示剧场版）
    const res = await getSubMenuListService(2)
    if (typeof res.data === 'object' && res.data !== null) {
      // 更新标签数据
      tagData.value = res.data
    }
  } catch (error) {
    console.error('获取剧场版子分类数据失败:', error)
    // 初始化默认标签数据
    tagData.value = {
      class: '',
      area: '',
      lang: '',
      year: ''
    }
  }
}

// 跳转到详情页
const goToMovieDetail = (id) => {
  if (!id) {
    console.error('无效的剧场版ID')
    return
  }
  try {
    const url = `/video/${id}`
    window.open(url, '_blank')
  } catch (error) {
    console.error('打开新窗口失败:', error)
    router.push(`/video/${id}`)
  }
}

onMounted(() => {
  // 组件挂载时获取数据
  if (!route.query.typeId) {
    const params = { typeId: 2 }
    currentQueryParams.value = params
    getMovieList(params)
  }
  // 获取子分类标签
  getMovieTags()
  // 向父组件发送tab-change事件
  emit('tab-change', '剧场版')
  
  // 添加滚动事件监听
  window.addEventListener('scroll', handleScroll)
  
  // 为浏览器添加resize事件监听器，优化图片加载
  window.addEventListener('resize', optimizeImageLoading)
})

// 组件卸载前移除滚动事件监听
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', optimizeImageLoading)
})

// 优化图片加载
const optimizeImageLoading = () => {
  // 使用nextTick确保DOM已更新
  nextTick(() => {
    // 使用Intersection Observer API检测可见元素，优先加载可见图片
    if ('IntersectionObserver' in window) {
      const lazyImageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const lazyImage = entry.target
            if (lazyImage.classList.contains('anime-img') && !lazyImage.classList.contains('loaded')) {
              // 图片进入视口后开始加载
              lazyImage.classList.add('loading')
              
              // 已经监测到，可以取消观察
              lazyImageObserver.unobserve(lazyImage)
            }
          }
        })
      })
      
      // 找到所有图片并添加监测
      document.querySelectorAll('.anime-img').forEach(img => {
        lazyImageObserver.observe(img)
      })
    }
  })
}

// 监听movieList变化，当数据加载完成后初始化懒加载
watch(() => movieList.value, (newVal) => {
  if (newVal.length > 0) {
    // 数据加载完成，初始化懒加载
    optimizeImageLoading()
  }
})
</script>

<template>
  <div class="movie-content">
    <!-- 分类标签行 -->
    <div class="category-container bg-black text-white">
      <div 
        v-for="row in tagRows" 
        :key="row.id" 
        class="tag-row"
      >
        <div class="tag-scroll-container">
          <div 
            v-for="tag in row.tags" 
            :key="tag"
            class="tag-item"
            :class="{'tag-active': selectedTags[row.id] === tag}"
            @click="selectTag(row.id, tag)"
          >
            {{ tag }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <img :src="Loading" alt="加载中" class="loading-img">
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="isEmpty" class="empty-container">
      <h3 class="empty-title">暂无剧场版内容</h3>
    </div>
    
    <!-- 剧场版列表 -->
    <div v-else>
      <div class="anime-list">
        <div 
          v-for="(movie, index) in movieList" 
          :key="`${movie.id || movie.vod_id}_${index}`"
          class="anime-card"
          :style="`animation-delay: ${index * 30}ms`"
          @click="goToMovieDetail(movie.id || movie.vod_id)"
        >
          <div class="anime-cover">
            <img 
              :src="movie.processedCover" 
              :alt="movie.title || movie.vod_name" 
              class="anime-img" 
              @error="handleImageError" 
              @load="handleImageLoaded"
              loading="lazy"
            />
            <div class="image-loading-overlay"></div>
            <span class="anime-episodes">{{ movie.vod_remarks || '' }}</span>
          </div>
          <div class="anime-title-container">
            <div class="anime-title">{{ movie.title || movie.vod_name }}</div>
            <div class="anime-sub" v-if="movie.score || movie.vod_score">{{ movie.score || movie.vod_score }}分</div>
          </div>
        </div>
      </div>
      
      <!-- 加载更多提示 -->
      <div v-if="isLoadingMore || isDataRendering" class="loading-more-container">
        <img :src="Loading" alt="加载中" class="loading-more-img">
        <p>{{ isDataRendering ? '数据加载中...' : '加载更多中...' }}</p>
      </div>
      
      <!-- 没有更多数据提示 -->
      <div v-if="!hasMore && movieList.length > 0 && !isDataRendering" class="no-more-container">
        <p>没有更多数据了</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 番剧内容区域 */
.movie-content {
  padding: 0 0 20px;
  margin-top: 0; 
}

/* 分类标签容器 */
.category-container {
  padding: 0 0 8px;
  background-color: white;
  border-bottom: 1px solid #eee;
  position: sticky;
  top: 60px; /* 根据您的导航栏高度调整 */
  z-index: 10;
}

/* 标签行 */
.tag-row {
  padding: 4px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tag-row:last-child {
  border-bottom: none;
}

/* 标签滚动容器 */
.tag-scroll-container {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  padding: 0 12px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

/* 隐藏滚动条 */
.tag-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 标签项 */
.tag-item {
  padding: 4px 16px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  border-radius: 20px;
  transition: all 0.2s ease;
  cursor: pointer;
  white-space: nowrap;
  flex: 0 0 auto;
}

/* 针对窄屏设备优化标签 */
@media screen and (max-width: 360px) {
  .tag-item {
    padding: 4px 12px;
    font-size: 13px;
  }
  
  .tag-scroll-container {
    gap: 6px;
    padding: 6px 10px;
  }
}

/* 针对宽屏设备优化标签布局 */
@media screen and (min-width: 768px) {
  .tag-scroll-container {
    flex-wrap: wrap;
    padding: 8px 24px;
    gap: 12px;
    overflow-x: visible;
  }
  
  .tag-item {
    padding: 4px 20px;
  }
}

/* 确保标签名称过长时能够正确显示 */
.tag-item {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.tag-item:hover {
  color: var(--el-text-color-primary);
  opacity: 0.9;
}

.tag-active {
  color: var(--el-color-white);
  background-color: var(--el-color-primary);
  font-weight: 500;
}

.tag-active:hover {
  opacity: 1;
  background-color: var(--el-color-primary-dark-2);
}

/* 番剧列表 */
.anime-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
  background: #f5f5f5;
  min-height: 300px; /* 最小高度，防止闪烁 */
}

@media screen and (min-width: 640px) {
  .anime-list {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (min-width: 768px) {
  .anime-list {
    grid-template-columns: repeat(5, 1fr);
    gap: 20px;
  }
}

@media screen and (min-width: 1024px) {
  .anime-list {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media screen and (min-width: 1280px) {
  .anime-list {
    grid-template-columns: repeat(7, 1fr);
  }
}

.anime-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.25s ease;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20px);
  height: 100%; /* 确保卡片高度统一 */
  border-radius: 8px;
  overflow: hidden;
  background-color: white;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anime-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.anime-card:hover .anime-img {
  transform: scale(1.05);
}

.anime-cover {
  position: relative;
  width: 100%;
  border-radius: 8px 8px 0 0; /* 只设置顶部圆角 */
  overflow: hidden;
  aspect-ratio: 3/4; /* 固定长宽比为3:4，适合电影海报 */
  background-color: #f0f0f0;
}

.anime-img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* 保持图片比例，裁剪超出部分 */
  object-position: center top; /* 优先显示图片上部分，因为电影海报重要信息通常在上方 */
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: 0;
}

.anime-img.loaded {
  opacity: 1;
}

.anime-img.loading {
  opacity: 0;
}

/* 添加统一的高度控制 */
.anime-title-container {
  padding: 8px 8px;
  display: flex;
  flex-direction: column;
  background-color: white;
  flex-grow: 1;
}

.anime-title {
  font-size: 13px;
  font-weight: 500;
  margin-top: 6px;
  text-align: center;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  color: #333;
}

.anime-sub {
  font-size: 10px;
  color: #666;
  text-align: center;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

/* 图片加载中的样式 */
.image-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    rgba(240, 240, 240, 0.3) 0%,
    rgba(240, 240, 240, 0.5) 50%,
    rgba(240, 240, 240, 0.3) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  pointer-events: none;
  opacity: 1;
}

.anime-img.loaded + .image-loading-overlay {
  opacity: 0;
}

/* 图片加载错误的样式 */
.anime-img.image-error {
  opacity: 0.8;
  filter: grayscale(0.5);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.anime-episodes {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  color: white;
  padding: 5px;
  font-size: 10px;
  text-align: center;
}

/* 加载中状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-img {
  width: 60px;
  height: 80px;
  margin-bottom: 10px;
}

/* 加载更多状态 */
.loading-more-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15px 0;
  background-color: transparent;
  position: relative;
  z-index: 10;
}

.loading-more-img {
  width: 40px;
  height: 40px;
  margin-bottom: 5px;
}

/* 没有更多数据提示 */
.no-more-container {
  display: flex;
  justify-content: center;
  padding: 10px 0 20px;
  color: #999;
  font-size: 14px;
  background-color: transparent;
  margin: 0 15px;
}

.retry-button:hover {
  background-color: #0055cc;
}

/* 空状态容器优化 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  border-radius: 8px;
  margin: 20px;
  text-align: center;
}


.empty-title {
  font-size: 18px;
  font-weight: 500;
}
</style>