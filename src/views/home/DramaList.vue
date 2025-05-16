<script setup>
import {computed, onMounted, ref, watch, onBeforeUnmount, nextTick} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {getDramaListService} from "@/api/Drama.js";
import {getSubMenuListService} from "@/api/home/anime.js";
import {handleImageUrl} from '@/utils/imageUtils.js';
import Loading from '@/assets/gif/loading.gif'

const emit = defineEmits(['tab-change'])

const router = useRouter()
const route = useRoute()

// 番剧列表
const DramaList = ref([])
// 原始番剧列表数据（用于本地筛选）
const originalDramaList = ref([])

// 分页相关
const currentPage = ref(1)
const hasMore = ref(true)
const isLoadingMore = ref(false)
// 滚动锁定标志，防止重复触发加载
const scrollLocked = ref(false)
// 数据渲染状态
const isDataRendering = ref(false)

// 加载状态
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

// 当前查询参数
const currentQueryParams = ref({})

// 分类标签数据
const tagData = ref({})

// 当前选中的标签值（每行一个）
const selectedTags = ref({
  0: '全部', // 类型
  1: '全部', // 季度
  2: '全部',  // 年份
  3: '时间'   // 排序（默认按时间）
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
    id: 2, 
    type: 'year', 
    title: '年份',
    tags: tagData.value.year ? ['全部', ...tagData.value.year.split(',')] : ['全部']
  },
  {
    id: 1,
    type: 'lang',
    title: '季度',
    tags: tagData.value.lang ? ['全部', ...tagData.value.lang.split(',')] : ['全部']
  },
  {
    id: 3,
    type: 'sort',
    title: '排序',
    tags: sortOptions.map(option => option.label)
  }
])

// 获取标签
const animeTags = async () => {
  try {
    // 获取番剧的子分类数据（type_id为1表示番剧）
    const res = await getSubMenuListService(1)
      // 处理子分类数据
      if (Array.isArray(res.data)) {
        // 如果是数组格式（旧格式）
        const classValues = []
        const yearValues = []
        const langValues = []
        
        // 遍历子分类数据，根据类型分类
        res.data.forEach(item => {
          if (item.type_name && item.type_name.includes('年')) {
            yearValues.push(item.type_name)
          } else if (item.type_name && ['1月', '4月', '7月', '10月'].some(month => item.type_name.includes(month))) {
            langValues.push(item.type_name)
          } else if (item.type_name) {
            classValues.push(item.type_name)
          }
        })
        
        // 更新标签数据
        tagData.value = {
          class: classValues.join(','),
          year: yearValues.join(','),
          lang: langValues.join(',')
        }
      } else if (typeof res.data === 'object' && res.data !== null) {
        // 如果是对象格式（新格式）
        tagData.value = res.data
      }
  } catch (error) {
    console.error('获取番剧子分类错误:', error)
    // 初始化默认标签数据
    tagData.value = {
      class: '',
      lang: '',
      year: ''
    }
  }
}

// 获取番剧列表
const getDramaList = async (params = {}, isAppend = false) => {
  try {
    if (!isAppend) {
      // 初始加载时显示加载状态
      isLoading.value = true
      hasError.value = false
      errorMessage.value = ''
      // 重置分页
      currentPage.value = 1
      hasMore.value = true
      // 保存当前查询参数
      currentQueryParams.value = {...params}
    } 

    // 构建请求参数
    const requestParams = {
      ...params,
      page: currentPage.value
    }
    
    // 调用接口获取数据
    const res = await getDramaListService(requestParams)
    
    // 处理不同类型的数据响应
    let newData = []
    
    if (typeof res.data === 'string') {

      const decryptedData = await decryptData(res.data);
      
      if (decryptedData && decryptedData.data && Array.isArray(decryptedData.data)) {
        // 解密成功，使用解密后的数据
        newData = decryptedData.data;
        console.log('解密成功，获取到番剧数据', newData.length, '条');
      }
    } else if (Array.isArray(res.data)) {
      // 如果是数组，直接使用
      newData = res.data
      console.log('获取到番剧数据', newData.length, '条');
    }
    
    if (newData.length === 0) {
      hasMore.value = false
    }
    
    isDataRendering.value = true
    
    if (isAppend) {
      DramaList.value = [...DramaList.value, ...newData]
      originalDramaList.value = [...originalDramaList.value, ...newData]
    } else {
      // 非追加模式，替换现有列表
      DramaList.value = newData
      originalDramaList.value = newData
    }
    
    // 使用nextTick等待DOM更新完成
    await nextTick()
    
    setTimeout(() => {
      isDataRendering.value = false
    }, 500)
    
  } catch (error) {
    console.error('获取番剧列表失败:', error)
    hasError.value = true
    errorMessage.value = error.message || '获取番剧列表失败'
    throw error
  } finally {
    if (!isAppend) {
      isLoading.value = false
    }
  }
}

// 加载更多数据
const loadMoreData = async () => {
  if (isLoading.value || isLoadingMore.value || !hasMore.value) return
  
  isLoadingMore.value = true
  
  currentPage.value += 1
  console.log('加载更多数据，页码：', currentPage.value)
  
  try {
    await getDramaList(currentQueryParams.value, true)
  } catch (error) {
    console.error('加载更多数据失败:', error)
    currentPage.value -= 1
  } finally {
    setTimeout(() => {
      isLoadingMore.value = false
    }, 300)
  }
}

const handleScroll = () => {
  if (isLoading.value || isLoadingMore.value || !hasMore.value || scrollLocked.value || isDataRendering.value) return
  
  const scrollHeight = document.documentElement.scrollHeight
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const clientHeight = document.documentElement.clientHeight
  
  // 当距离底部100px时提前加载
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
  
  // 重置分页
  currentPage.value = 1
  hasMore.value = true
  
  // 类型筛选
  if (rowId === 0) {
    if (tag === '全部') {
      getDramaList(currentQueryParams.value)
    } else {
      DramaList.value = originalDramaList.value.filter(drama => {
        if (!drama.vod_class) return false
        const classes = drama.vod_class.split(',')
        return classes.includes(tag)
      })
    }
    return
  }
  
  // 季度筛选
  if (rowId === 1 && tag !== '全部') {
    params.lang = tag
  }
  
  // 年份筛选
  if (rowId === 2 && tag !== '全部') {
    params.year = tag
  }
  
  // 排序选项
  if (rowId === 3) {
    params.type = getSortValue(tag)
  }
  
  // 保存当前typeId参数
  if (route.query.typeId) {
    params.typeId = route.query.typeId
  }
  
  if (Object.keys(params).length > 0) {
    getDramaList(params)
  }
}

// 直接在组件中实现AES解密功能
async function decryptData(encryptedData) {
  try {
    console.log('原始加密数据:', encryptedData);
    
    // 移除前缀
    const prefix = 'FROMSKZZJM';
    let ciphertextHex = encryptedData;
    
    if (encryptedData.startsWith(prefix)) {
      ciphertextHex = encryptedData.substring(prefix.length);
      console.log('移除前缀后:', ciphertextHex);
    }
    
    // 将十六进制字符串转换为字节数组
    const ciphertext = hexStringToByteArray(ciphertextHex);
    const key = new TextEncoder().encode('ygcnbclnqzsmebxd');
    const iv = new TextEncoder().encode('8249692684143708');
    
    // 导入密钥
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      key,
      { name: "AES-CBC" },
      false,
      ["decrypt"]
    );
    
    // 解密数据
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-CBC",
        iv: iv
      },
      cryptoKey,
      ciphertext
    );
    
    // 将解密后的字节转换为字符串
    const decryptedText = new TextDecoder().decode(decrypted);
    console.log('解密结果:', decryptedText);
    
    // 解析JSON
    try {
      return JSON.parse(decryptedText);
    } catch (jsonError) {
      console.error('JSON解析失败:', jsonError);
      return null;
    }
  } catch (error) {
    console.error('解密失败:', error);
    return null;
  }
}

// 辅助函数：将十六进制字符串转换为字节数组
function hexStringToByteArray(hexString) {
  const len = hexString.length;
  const bytes = new Uint8Array(len / 2);
  
  for (let i = 0; i < len; i += 2) {
    bytes[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  
  return bytes;
}

// 跳转到详情页
const goToAnimeDetail = (id) => {
  if (!id) {
    console.error('无效的番剧ID')
    return
  }
  console.log('跳转到番剧详情页,ID:', id)
  router.push(`/video/${id}`)
}

// 挂载函数
onMounted(() => {
  emit('tab-change', '番剧')
  animeTags()
  
  // 添加滚动事件监听
  window.addEventListener('scroll', handleScroll)
  
  // 检查URL参数中是否有typeId
  if (route.query.typeId) {
    // 如果有typeId参数，使用该参数获取对应分类的番剧
    const params = { typeId: route.query.typeId }
    currentQueryParams.value = params
    getDramaList(params)
  } else {
    // 否则获取全部番剧
    getDramaList()
  }
})

// 组件卸载前移除滚动事件监听
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

// 监听路由参数变化
watch(() => route.query.typeId, (newTypeId) => {
  if (newTypeId) {
    // 如果typeId变化，重新获取对应分类的番剧
    const params = { typeId: newTypeId }
    currentQueryParams.value = params
    getDramaList(params)
  } else {
    // 如果typeId被移除，获取全部番剧
    getDramaList()
  }
})

// 图片加载完成计数
let loadedImagesCount = 0
const totalNewImages = ref(0)

// 处理图片加载完成事件
const handleImageLoad = () => {
  loadedImagesCount++
  // 如果所有图片都加载完成，可以提前结束渲染状态
  if (isDataRendering.value && loadedImagesCount >= totalNewImages.value * 0.7) {
    // 当70%的图片加载完成时，认为渲染已经基本完成
    isDataRendering.value = false
    console.log('图片加载完成，可以加载下一页')
  }
}

// 处理图片加载错误
const handleImageError = () => {
  loadedImagesCount++
  // 即使图片加载失败，也计入已加载数量
  if (isDataRendering.value && loadedImagesCount >= totalNewImages.value * 0.7) {
    isDataRendering.value = false
  }
}

// 监听DramaList变化，重置图片加载计数器
watch(() => DramaList.value.length, (newLength, oldLength) => {
  if (newLength > oldLength) {
    // 有新数据添加
    loadedImagesCount = 0
    totalNewImages.value = newLength - oldLength
    console.log(`需要加载${totalNewImages.value}张新图片`)
  }
})
</script>

<template>
  <div class="anime-content">
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

    <!-- 错误提示 -->
    <div v-else-if="hasError" class="error-container">
      <p>{{ errorMessage || '加载失败，请重试' }}</p>
      <button @click="getDramaList()" class="retry-button">重新加载</button>
    </div>

    <!-- 空数据提示 -->
    <div v-else-if="DramaList.length === 0" class="empty-container">
      <p>暂无数据</p>
    </div>

    <!-- 番剧列表 -->
    <div v-else>
      <div class="anime-list">
        <div 
          v-for="(anime, index) in DramaList"
          :key="`${anime.vod_id}_${index}`"
          class="anime-card"
          :style="`animation-delay: ${index * 30}ms`"
          @click="goToAnimeDetail(anime.vod_id)"
        >
          <div class="anime-cover">
            <img 
              :src="handleImageUrl(anime.vod_pic)" 
              alt="anime cover" 
              class="anime-img" 
              @load="handleImageLoad"
              @error="handleImageError"
            />
            <div class="image-loading-overlay"></div>
            <span class="anime-episodes">{{ anime.vod_remarks || '更新中' }}</span>
          </div>
          <div class="anime-title">{{ anime.vod_name }}</div>
          <div class="anime-sub" v-if="anime.vod_sub">{{ anime.vod_sub }}</div>
        </div>
      </div>
    
      <!-- 加载更多提示 -->
      <div v-if="isLoadingMore || isDataRendering" class="loading-more-container">
        <img :src="Loading" alt="加载中" class="loading-more-img">
        <p>{{ isDataRendering ? '数据加载中...' : '加载更多中...' }}</p>
      </div>
    
      <!-- 没有更多数据提示 -->
      <div v-if="!hasMore && DramaList.length > 0 && !isDataRendering" class="no-more-container">
        <p>没有更多数据了</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 番剧内容区域 */
.anime-content {
  padding: 0 0 20px;
  margin-top: 0; 
}

/* 分类标签容器 */
.category-container {
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
  gap: 12px;
  padding: 12px;
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
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(20px);
  height: 100%;
  border-radius: 4px;
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
  transform: translateY(-3px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.anime-card:hover .anime-img {
  transform: scale(1.05);
}

.anime-cover {
  position: relative;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  aspect-ratio: 3/4;
  background-color: #f0f0f0;
}

.anime-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
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