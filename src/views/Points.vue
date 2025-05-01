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

// 原始记录数据
const originalRecords = ref([])

// 记录类型筛选
const currentFilter = ref('all') // 'all', 'recharge', 'consume'

// 加载状态
const loading = ref(false)

// 获取用户积分记录
const getUserPointsRecord = async () => {
  // 检查用户是否登录
  if (!userStore.info || !userStore.info.user_id) {
    ElMessage.warning('请先登录')
    await router.push('/login')
    return
  }
  
  try {
    loading.value = true
    const res = await getUserScoreService(userStore.info.user_id)
    
    if (res && res.data) {
      console.log('获取到的积分记录:', res.data)
      
      // 设置总积分
      pointsData.value.total = res.data.total || 0
      
      // 处理积分记录
      if (res.data.records && Array.isArray(res.data.records)) {
        const processedRecords = res.data.records.map(record => ({
          id: record.id,
          type: record.type, // 积分类型
          points: record.points || 0, // 积分数量
          description: record.description || '', // 积分描述
          time: formatDate(record.time), // 时间
          isPositive: record.card_pwd === 'use_points_1', // 根据card_pwd判断是充值还是消费
          isConsumption: record.card_pwd === 'use_points_8', // 是否为消费
          transactionType: record.card_pwd === 'use_points_1' ? '充值' : '消费',
          card_pwd: record.card_pwd // 原始类型值
        }))
        
        // 保存原始记录数据
        originalRecords.value = processedRecords
        // 设置当前显示的记录
        pointsData.value.records = processedRecords
      }
    }
  } catch (error) {
    console.error('获取积分记录失败:', error)
    ElMessage.error('获取积分记录失败')
  } finally {
    loading.value = false
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
  router.back()
}

// 组件挂载时获取数据
onMounted(() => {
  getUserPointsRecord()
})
</script>

<template>
  <div class="points-container">
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
            <div class="record-tag" :class="{'tag-positive': record.isPositive, 'tag-negative': record.isConsumption}">
              {{ record.transactionType }}
            </div>
          </div>
          <div class="record-time">{{ record.time }}</div>
        </div>
        <div class="record-right" :class="{ 'positive': record.isPositive, 'negative': record.isConsumption }">
          {{ record.isPositive ? '+' : '-' }}{{ Math.abs(record.points) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>

.points-container {
  min-height: 100vh;
  background-color: white;
  padding-bottom: 60px;
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
</style> 