<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getUserScoreService } from '@/api/user.js'
import { ElMessage } from 'element-plus'
import useUserInfoStore from '@/stores/userstores.js'
import { ArrowLeft, Loading, Wallet } from "@element-plus/icons-vue"

const router = useRouter()
const userStore = useUserInfoStore()

// 用户积分数据
const pointsData = ref({
  total: 0,
  records: []
})

// 加载状态
const loading = ref(false)

// 获取用户积分记录
const getUserPointsRecord = async () => {
  // 检查用户是否登录
  if (!userStore.info || !userStore.info.user_id) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    loading.value = true
    const res = await getUserScoreService(userStore.info.user_id)
    
    if (res && res.code === 200 && res.data) {
      console.log('获取到的积分记录:', res.data)
      
      // 处理积分记录
      if (Array.isArray(res.data)) {
        // 计算总积分
        let total = 0
        res.data.forEach(record => {
          if (record.card_pwd === 'use_points_1') {
            total += record.card_points
          } else if (record.card_pwd === 'use_points_8') {
            total -= record.card_points
          }
        })
        pointsData.value.total = total
        
        // 处理记录
        pointsData.value.records = res.data.map(record => ({
          id: record.card_id || Math.random().toString(36).substring(2, 10),
          points: record.card_points || 0,
          description: getDescriptionByType(record.card_pwd),
          time: formatDate(record.card_use_time || record.card_add_time),
          isPositive: record.card_pwd === 'use_points_1',
          isConsumption: record.card_pwd === 'use_points_8',
          card_pwd: record.card_pwd
        }))
      }
    }
  } catch (error) {
    console.error('获取积分记录失败:', error)
    ElMessage.error('获取积分记录失败')
  } finally {
    loading.value = false
  }
}

// 根据记录类型获取描述
const getDescriptionByType = (type) => {
  switch (type) {
    case 'use_points_1':
      return '积分充值'
    case 'use_points_8':
      return '积分消费'
    default:
      return '积分变动'
  }
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '未知'
  const date = new Date(timestamp * 1000)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 返回上一页
const goBack = () => {
  router.push('/profile')
}

// 禁止页面滚动
const disablePageScroll = () => {
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
  document.body.style.height = '100%'
}

// 组件挂载时获取数据
onMounted(() => {
  getUserPointsRecord()
  // 禁止页面滑动
  disablePageScroll()
})
</script>

<template>
  <div class="points-container fixed inset-0 bg-white overflow-hidden">
    <!-- 头部导航栏 -->
    <div class="header">
      <div class="header-left" @click="goBack">
        <el-icon size="20">
          <ArrowLeft />
        </el-icon>
      </div>
      <div class="header-title">我的积分</div>
      <div class="header-right"></div>
    </div>

    <!-- 内容区域 - 添加滚动容器 -->
    <div class="content-scroll-area">
      <!-- 积分记录列表 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="loading-icon" size="32">
          <Loading />
        </el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="pointsData.records.length === 0" class="empty-records">
        <div class="empty-icon">
          <el-icon size="48">
            <Wallet />
          </el-icon>
        </div>
        <div class="empty-text">暂无积分记录</div>
      </div>

      <div v-else class="points-records-list">
        <div 
          v-for="record in pointsData.records" 
          :key="record.id"
          class="record-item"
        >
          <div class="record-left">
            <div class="record-title-row">
              <div class="record-title">{{ record.description }}</div>

            </div>
            <div class="record-time">{{ record.time }}</div>
          </div>
          <div class="record-right" :class="{ 'positive': record.isPositive, 'negative': record.isConsumption }">
            {{ record.isPositive ? '+' : '-' }}{{ Math.abs(record.points) }}
          </div>
        </div>
      </div>
      
      <!-- 底部安全区域 -->
      <div class="h-16 bg-white safe-area-bottom"></div>
    </div>
  </div>
</template>

<style scoped>
.points-container {
  display: flex;
  flex-direction: column;
  touch-action: none;
  overscroll-behavior: none;
}

/* 头部导航栏 */
.header {
  height: 56px;
  background-color: #dc2626;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;
}

.header-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
}

.header-right {
  width: 40px;
}

/* 内容滚动区域 */
.content-scroll-area {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* 积分记录列表 */
.points-records-list {
  margin: 0 16px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #f3f4f6;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  flex: 1;
}

.record-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-title {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.record-tag {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.tag-positive {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.tag-negative {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.record-time {
  font-size: 12px;
  color: #9ca3af;
}

.record-right {
  font-size: 16px;
  font-weight: 600;
}

.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

/* 加载中状态 */
.loading-container {
  margin: 40px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}

.loading-icon {
  animation: spin 1s linear infinite;
  margin-bottom: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 空记录状态 */
.empty-records {
  margin: 40px 16px;
  padding: 40px 0;
  background-color: white;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.empty-icon {
  color: #d1d5db;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 14px;
  color: #9ca3af;
}

.info-content p {
  margin: 8px 0;
}

/* 安全区域 - 用于iPhone X及以上机型底部黑条 */
@supports (padding: max(0px)) {
  .safe-area-bottom {
    padding-bottom: max(env(safe-area-inset-bottom, 16px), 60px);
  }
}
</style> 