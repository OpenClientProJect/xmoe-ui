<script setup>
import {computed, onMounted, ref, watch} from 'vue'
import {useRouter, useRoute} from 'vue-router'
import {getDramaListService} from "@/api/Drama.js";
import {getSubMenuListService} from "@/api/home/anime.js";
import {handleImageUrl} from '@/utils/imageUtils.js';

const emit = defineEmits(['tab-change'])

const router = useRouter()
const route = useRoute()

// 番剧列表
const DramaList = ref([])
// 原始番剧列表数据（用于本地筛选）
const originalDramaList = ref([])

// 加载状态
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

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
const getDramaList = async (params = {}) => {
  try {
    isLoading.value = true
    hasError.value = false
    errorMessage.value = ''
    
    // 调用接口获取数据
    const res = await getDramaListService(params)
    
    // 处理不同类型的数据响应
    if (typeof res.data === 'string') {
      // 如果是字符串，尝试解密
      console.log('检测到加密数据，尝试解密');
      
        const decryptedData = await decryptData(res.data);
        
        if (decryptedData && decryptedData.data && Array.isArray(decryptedData.data)) {
          // 解密成功，使用解密后的数据
          originalDramaList.value = decryptedData.data;
          DramaList.value = decryptedData.data;
          console.log('解密成功，获取到番剧数据', DramaList.value.length, '条');
      }
    } else if (Array.isArray(res.data)) {
      // 如果是数组，直接使用
      originalDramaList.value = res.data
      DramaList.value = res.data
      console.log('获取到番剧数据', DramaList.value.length, '条');
    }
  } catch (error) {
    console.error('获取番剧列表失败:', error)
    hasError.value = true
    errorMessage.value = error.message || '获取番剧列表失败'
  } finally {
    isLoading.value = false
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
  
  // 类型筛选
  if (rowId === 0) {
    if (tag === '全部') {
      // 重置为原始列表
      DramaList.value = [...originalDramaList.value]
    } else {
      // 本地筛选vod_class包含所选标签的番剧
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
  
  // 如果有筛选参数，则调用API重新获取数据
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
  // 设置当前标签为"番剧"
  emit('tab-change', '番剧')
  // 获取番剧子分类数据
  animeTags()
  
  // 检查URL参数中是否有typeId
  if (route.query.typeId) {
    // 如果有typeId参数，使用该参数获取对应分类的番剧
    getDramaList({ typeId: route.query.typeId })
  } else {
    // 否则获取全部番剧
    getDramaList()
  }
})

// 监听路由参数变化
watch(() => route.query.typeId, (newTypeId) => {
  if (newTypeId) {
    // 如果typeId变化，重新获取对应分类的番剧
    getDramaList({ typeId: newTypeId })
  } else {
    // 如果typeId被移除，获取全部番剧
    getDramaList()
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
      <div class="loading-spinner"></div>
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
    <div v-else class="anime-list">
      <div 
        v-for="anime in DramaList"
        :key="anime.vod_id"
        class="anime-card"
        @click="goToAnimeDetail(anime.vod_id)"
      >
        <div class="anime-cover">
          <img :src="handleImageUrl(anime.vod_pic)" alt="anime cover" class="anime-img" />
          <span class="anime-episodes">{{ anime.vod_remarks || '更新中' }}</span>
        </div>
        <div class="anime-title">{{ anime.vod_name }}</div>
        <div class="anime-sub" v-if="anime.vod_sub">{{ anime.vod_sub }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 番剧内容区域 */
.anime-content {
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