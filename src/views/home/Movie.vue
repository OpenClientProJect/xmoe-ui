<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDramaListService } from '@/api/Drama.js'
import { getSubMenuListService } from '@/api/home/anime.js'

const route = useRoute()
const router = useRouter()

// 状态变量
const movieList = ref([])
const originalMovieList = ref([]) // 用于本地筛选的原始数据
const isLoading = ref(false)
const isEmpty = ref(false)
const activeTab = ref('剧场版')

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

// 获取剧场版列表数据
const getMovieList = async (params = {}) => {
  try {
    isLoading.value = true
    isEmpty.value = false
    
    // 合并默认参数和传入的参数
    const queryParams = {
      typeId: params.typeId || 2, // 默认使用剧场版的typeId
      page: 1,
      pageSize: 20,
      ...params
    }
    
    const res = await getDramaListService(queryParams)
    
    if (res.code === 200 && Array.isArray(res.data)) {
      movieList.value = res.data
      originalMovieList.value = res.data // 保存原始数据用于本地筛选
      isEmpty.value = res.data.length === 0
    } else {
      console.error('获取剧场版列表失败:', res.message || '未知错误')
      isEmpty.value = true
    }
  } catch (error) {
    console.error('获取剧场版列表错误:', error)
    isEmpty.value = true
  } finally {
    isLoading.value = false
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
  getMovieList({ typeId: newTypeId || 2 }) // 如果没有typeId参数，使用默认值2
}, { immediate: true })

// 获取排序参数值
const getSortValue = (sortLabel) => {
  const option = sortOptions.find(opt => opt.label === sortLabel)
  return option ? option.value : 'updateTime'
}

// 选择标签
const selectTag = (rowId, tag) => {
  selectedTags.value[rowId] = tag
  
  // 构建查询参数
  const params = {}
  
  // 类型筛选
  if (rowId === 0) {
    if (tag === '全部') {
      // 重置为原始列表
      movieList.value = [...originalMovieList.value]
    } else {
      // 本地筛选vod_class包含所选标签的剧场版
      movieList.value = originalMovieList.value.filter(movie => {
        if (!movie.vod_class) return false
        const classes = movie.vod_class.split(',')
        return classes.includes(tag)
      })
    }
    return
  }
  
  // 地区筛选
  if (rowId === 1 && tag !== '全部') {
    params.area = tag
  }
  
  // 语言筛选
  if (rowId === 2 && tag !== '全部') {
    params.lang = tag
  }
  
  // 年份筛选
  if (rowId === 3 && tag !== '全部') {
    params.year = tag
  }
  
  // 排序选项
  if (rowId === 4) {
    params.type = getSortValue(tag)
  }
  
  // 如果有筛选参数，则调用API重新获取数据
  if (Object.keys(params).length > 0) {
    getMovieList(params)
  }
}

// 获取子分类标签
const getMovieTags = async () => {
  try {
    // 获取剧场版的子分类数据（typeId为2表示剧场版）
    const res = await getSubMenuListService(2)
    if (typeof res.data === 'object' && res.data !== null) {
      // 更新标签数据
      tagData.value = res.data
      console.log('剧场版子分类数据:', tagData.value)
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

onMounted(() => {
  // 组件挂载时获取数据
  if (!route.query.typeId) {
    getMovieList(2) // 默认使用剧场版的typeId
  }
  // 获取子分类标签
  getMovieTags()
  // 向父组件发送tab-change事件
  emit('tab-change', '剧场版')
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
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空状态 -->
    <div v-else-if="isEmpty" class="empty-container">
      <p>暂无剧场版内容</p>
    </div>
    
    <!-- 剧场版列表 -->
    <div v-else class="anime-list">
      <div 
        v-for="movie in movieList" 
        :key="movie.id || movie.vod_id"
        class="anime-card"
        @click="router.push(`/video/${movie.id || movie.vod_id}`)"
      >
        <div class="anime-cover">
          <img :src="movie.cover || movie.vod_pic" :alt="movie.title || movie.vod_name" class="anime-img" />
          <span class="anime-episodes">{{ movie.vod_remarks || '' }}</span>
        </div>
        <div class="anime-title">{{ movie.title || movie.vod_name }}</div>
        <div class="anime-sub" v-if="movie.score || movie.vod_score">{{ movie.score || movie.vod_score }}分</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 番剧内容区域 */
.movie-content {
  padding: 0 0 80px;
  margin-top: 0; 
}

/* 分类标签容器 */
.category-container {
  padding: 0 0 8px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
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
  padding: 8px 12px;
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
  gap: 12px;
  padding: 12px;
  background: #f5f5f5;
}

@media screen and (min-width: 640px) {
  .anime-list {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (min-width: 768px) {
  .anime-list {
    grid-template-columns: repeat(5, 1fr);
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
  margin-bottom: 20px;
}

.anime-cover {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 3/4;
}

.anime-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
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

.anime-title {
  font-size: 12px;
  margin-top: 6px;
  text-align: center;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
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

/* 加载中状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #076AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误和空数据容器 */
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: #666;
}

.retry-button {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #076AFF;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.retry-button:hover {
  background-color: #0055cc;
}
</style>