<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import useUserInfoStore from '@/stores/userstores.js'
import { ArrowLeft, Loading, ChatRound } from "@element-plus/icons-vue"
import { getMessageListService } from "@/api/home/anime.js"

import Message from '@/assets/message.svg'

const router = useRouter()
const userStore = useUserInfoStore()

// 消息数据
const messagesData = ref({
  count: 0,
  lists: []
})

// 加载状态
const loading = ref(false)

// 当前选中的消息ID
const currentMessageId = ref(null)

// 是否显示消息列表
const showMessageList = ref(true)

// 获取用户消息列表
const getUserMessages = async () => {
  // 检查用户是否登录
  if (!userStore.info || !userStore.info.user_id) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  try {
    loading.value = true
    
    // 调用API获取消息列表
    const res = await getMessageListService()
    
    if (res && res.code === 200 && res.data) {
      // 处理消息数据
      messagesData.value = {
        count: res.data.length,
        lists: res.data.map(item => ({
          id: item.art_id,
          title: item.art_name,
          content: item.art_blurb || '暂无内容简介',
          fullContent: item.art_content,
          time: item.art_time || item.art_time_add,
          type: 'system'
        }))
      }
    } else {
      messagesData.value = {
        count: 0,
        lists: []
      }
    }
  } catch (error) {
    console.error('获取消息列表失败:', error)
    ElMessage.error('获取消息列表失败')
  } finally {
    loading.value = false
  }
}

// 查看消息详情
const viewMessageDetail = (message) => {
  currentMessageId.value = message.id
  showMessageList.value = false
}

// 返回消息列表
const backToList = () => {
  showMessageList.value = true
  currentMessageId.value = null
}

// 获取当前消息
const getCurrentMessage = () => {
  return messagesData.value.lists.find(item => item.id === currentMessageId.value)
}

// 格式化时间戳为可读日期
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
  // 如果正在查看消息详情，则返回消息列表
  if (!showMessageList.value) {
    backToList()
    return
  }
  
  // 否则返回个人中心
  router.push('/profile')
}

// 组件挂载时获取数据
onMounted(() => {
  getUserMessages()
})
</script>

<template>
  <div class="messages-container">
    <!-- 头部导航栏 -->
    <div class="header">
      <div class="header-left" @click="goBack">
        <el-icon size="20">
          <ArrowLeft />
        </el-icon>
      </div>
      <div class="header-title">{{ showMessageList ? '消息中心' : getCurrentMessage()?.title }}</div>
    </div>

    <!-- 消息列表 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="loading-icon" size="32">
        <Loading />
      </el-icon>
      <span>加载中...</span>
    </div>

    <!-- 消息列表页面 -->
    <template v-else-if="showMessageList">
      <div v-if="messagesData.lists.length === 0" class="empty-messages">
        <div class="empty-icon">
          <el-icon size="48">
            <ChatRound />
          </el-icon>
        </div>
        <div class="empty-text">暂无消息</div>
      </div>

      <div v-else class="messages-list">
        <div 
          v-for="message in messagesData.lists" 
          :key="message.id"
          class="message-item"
          @click="viewMessageDetail(message)"
        >
          <div class="message-left">
            <div class="message-icon-container">
              <img :src="Message" alt="消息" class="message-icon"/>
            </div>
          </div>
          <div class="message-content">
            <div class="message-header">
              <div class="message-title">{{ message.title }}</div>
              <div class="message-time">{{ formatDate(message.time) }}</div>
            </div>
            <div class="message-preview" v-if="message.content">{{ message.content }}</div>
          </div>
        </div>
      </div>
    </template>

    <!-- 消息详情页面 -->
    <div v-else-if="currentMessageId" class="message-detail-page">
      <div class="message-detail-time">{{ formatDate(getCurrentMessage()?.time) }}</div>
      <div class="message-detail-content" v-html="getCurrentMessage()?.fullContent || getCurrentMessage()?.content"></div>
    </div>
  </div>
</template>

<style scoped>
.messages-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60px;
}

/* 头部导航栏 */
.header {
  height: 56px;
  background-color: #42b983;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  text-align: center;
  flex: 1;
  margin: 0 16px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 消息列表 */
.messages-list {
  margin: 12px;
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 16px;
  background-color: white;
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
}

.message-left {
  margin-right: 12px;
}

.message-icon-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.message-icon {
  width: 32px;
  height: 32px;
}

.message-content {
  flex: 1;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.message-title {
  font-weight: 500;
  color: #333;
}

.message-time {
  font-size: 12px;
  color: #9ca3af;
}

.message-preview {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
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

/* 空消息状态 */
.empty-messages {
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

/* 消息详情页面 */
.message-detail-page {
  background-color: white;
  padding: 20px 16px;
  margin: 0;
  min-height: calc(100vh - 130px);
}

.message-detail-time {
  font-size: 14px;
  color: #6b7280;
  text-align: center;
  margin-bottom: 20px;
}

.message-detail-content {
  font-size: 15px;
  line-height: 1.6;
  color: #374151;
}

.message-detail-content :deep(ol),
.message-detail-content :deep(ul) {
  padding-left: 20px;
  margin: 12px 0;
}

.message-detail-content :deep(li) {
  margin-bottom: 8px;
}

.message-detail-content :deep(p) {
  margin: 10px 0;
}
</style> 