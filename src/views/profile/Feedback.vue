<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import useUserInfoStore from '@/stores/userstores.js'
import { ArrowLeft, Loading } from "@element-plus/icons-vue"
import { getMessageService, sendMessageService } from "@/api/home/anime.js"

const router = useRouter()
const userStore = useUserInfoStore()

// 留言内容
const feedbackContent = ref('')
// 留言历史
const feedbackHistory = ref([])
// 加载状态
const loading = ref(false)
// 提交状态
const submitting = ref(false)
// 最大字符数限制
const maxLength = 200

// 检查用户登录状态
const checkLoginStatus = () => {
  if (!userStore.info || !userStore.info.user_id) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return false
  }
  return true
}

// 获取历史留言
const getFeedbackHistory = async () => {
  if (!checkLoginStatus()) return
  
  try {
    loading.value = true
    
    const res = await getMessageService(userStore.info.user_id)
    
      // 处理留言数据，适配 API 返回的格式
      feedbackHistory.value = Array.isArray(res.data) ? res.data.map((item, index) => ({
        id: item.id || item.gbook_id,
        content: item.gbook_content || item.content || '',
        time: item.gbook_time || item.time || Date.now() / 1000,
        reply: item.gbook_reply || item.reply || '',
        replyTime: item.gbook_reply_time || item.reply_time
      })) : []
  } finally {
    loading.value = false
  }
}

// 提交留言
const submitFeedback = async () =>
{
  if (!checkLoginStatus()) return

  if (!feedbackContent.value.trim()) {
    ElMessage.warning('留言内容不能为空')
    return
  }

  try {
    submitting.value = true

    const params = {
      content: feedbackContent.value.trim(),
      user_id: userStore.info.user_id,
    }

    await sendMessageService(params);
    ElMessage.success('留言提交成功')

    // 清空输入框
    feedbackContent.value = ''

    // 刷新留言列表
    await getFeedbackHistory()
  } catch (error) {
    console.error('提交留言失败:', error)
  } finally {
    submitting.value = false
  }
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
  router.push('/profile')
}

// 组件挂载时获取数据
onMounted(() => {
  getFeedbackHistory()
})
</script>

<template>
  <div class="feedback-container">
    <!-- 头部导航栏 -->
    <div class="header">
      <div class="header-left" @click="goBack">
        <el-icon size="20">
          <ArrowLeft />
        </el-icon>
      </div>
      <div class="header-title">留言求片</div>
      <div class="header-right"></div>
    </div>

    <!-- 留言输入区域 -->
    <div class="feedback-input-area">
      <div class="textarea-container">
        <textarea
          v-model="feedbackContent"
          placeholder="请输入留言内容"
          :maxlength="maxLength"
          rows="6"
          class="feedback-textarea"
        ></textarea>
        <div class="character-count">{{ feedbackContent.length }}/{{ maxLength }}</div>
      </div>
      <div class="submit-btn-container">
        <button 
          class="submit-btn" 
          :disabled="!feedbackContent.trim() || submitting" 
          @click="submitFeedback"
        >
          {{ submitting ? '提交中...' : '留言' }}
        </button>
      </div>
    </div>

    <!-- 历史留言记录 -->
    <div class="history-section">
      <div class="section-title">历史留言</div>
      
      <div v-if="loading" class="loading-container">
        <el-icon class="loading-icon" size="32">
          <Loading />
        </el-icon>
        <span>加载中...</span>
      </div>

      <div v-else-if="!feedbackHistory.length" class="empty-history">
        暂无留言记录
      </div>

      <div v-else class="history-list">
        <div 
          v-for="item in feedbackHistory" 
          :key="item.id"
          class="history-item"
        >
          <div class="history-content">{{ item.content }}</div>
          <div class="history-time">{{ formatDate(item.time) }}</div>
          
          <div v-if="item.reply" class="reply-container">
            <div class="reply-label">站长回复：</div>
            <div class="reply-content">{{ item.reply }}</div>
            <div v-if="item.replyTime" class="reply-time">{{ formatDate(item.replyTime) }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.feedback-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60px;
}

/* 头部导航栏 */
.header {
  height: 56px;
  background-color: #8a2be2;
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
  text-align: center;
  flex: 1;
}

.header-right {
  width: 40px;
}

/* 留言输入区域 */
.feedback-input-area {
  margin: 16px;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.textarea-container {
  position: relative;
  margin-bottom: 12px;
}

.feedback-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  resize: none;
  font-size: 16px;
  line-height: 1.5;
}

.feedback-textarea:focus {
  outline: none;
  border-color: #8a2be2;
}

.character-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #9ca3af;
}

.submit-btn-container {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  padding: 10px 24px;
  background-color: #8a2be2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #7a1cc1;
}

.submit-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

/* 历史留言记录 */
.history-section {
  margin: 16px;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #374151;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background-color: #f9fafb;
}

.history-content {
  font-size: 15px;
  color: #374151;
  margin-bottom: 8px;
  line-height: 1.5;
}

.history-time {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 8px;
}

.reply-container {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #e5e7eb;
}

.reply-label {
  font-size: 13px;
  font-weight: 500;
  color: #8a2be2;
  margin-bottom: 4px;
}

.reply-content {
  font-size: 14px;
  color: #374151;
  line-height: 1.5;
}

.reply-time {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 4px;
  text-align: right;
}

.empty-history {
  text-align: center;
  color: #9ca3af;
  padding: 24px 0;
}

/* 加载中状态 */
.loading-container {
  margin: 24px 0;
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
</style> 