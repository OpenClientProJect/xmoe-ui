<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

// 获取用户ID
const userId = ref('')

// 数据
const activeTab = ref('history') // 默认显示播放历史
const loading = ref(false)
const playHistoryList = ref([])
const collectList = ref([])

// 初始化用户ID
onMounted(() => {
  // 初始加载播放历史
  getPlayHistory()
})

// 切换标签
const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'history') {
    getPlayHistory()
  } else if (tab === 'collect') {
    getCollectList()
  }
}

// 获取播放历史
const getPlayHistory = async () => {
}

// 获取追剧列表
const getCollectList = async () => {
}

// 跳转到详情页
const goToVideoDetail = (id) => {
  router.push(`/detail/${id}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '未知'
  
  const date = new Date(timestamp * 1000)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
</script>

<template>
  <div class="user-history">
    <!-- 左侧菜单 -->
    <div class="left-menu">
      <div 
        class="menu-item" 
        :class="{ active: activeTab === 'history' }"
        @click="switchTab('history')"
      >
        <span>播放记录</span>
        <span v-if="activeTab === 'history'" class="menu-count">{{playHistoryList.length || 0}}</span>
      </div>
      <div 
        class="menu-item"
        :class="{ active: activeTab === 'collect' }"
        @click="switchTab('collect')"
      >
        <span>我的追剧</span>
        <span v-if="activeTab === 'collect'" class="menu-count">{{collectList.length || 0}}</span>
      </div>
    </div>

    <!-- 右侧内容 -->
    <div class="content-area">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated />
      </div>
      
      <div v-else-if="activeTab === 'history' && playHistoryList.length === 0" class="empty-tip">
        暂无播放记录
      </div>

      <div v-else-if="activeTab === 'collect' && collectList.length === 0" class="empty-tip">
        暂无追剧记录
      </div>

      <div v-else-if="activeTab === 'history'" class="history-list">
        <div v-for="item in playHistoryList" :key="item.id" class="history-item" @click="goToVideoDetail(item.id)">
          <div class="cover-container">
            <img :src="item.cover" alt="封面" class="cover-img">
            <div class="episode-tag">{{item.episode}}</div>
          </div>
          <div class="item-info">
            <div class="title">{{item.title}}</div>
            <div class="update-time">最近观看：{{item.updateTime}}</div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'collect'" class="history-list">
        <div v-for="item in collectList" :key="item.id" class="history-item" @click="goToVideoDetail(item.id)">
          <div class="cover-container">
            <img :src="item.cover" alt="封面" class="cover-img">
            <div class="episode-tag">{{item.episode}}</div>
          </div>
          <div class="item-info">
            <div class="title">{{item.title}}</div>
            <div class="update-time">收藏时间：{{item.updateTime}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.user-history {
  display: flex;
  min-height: calc(100vh - 70px);
  background-color: #f5f5f5;
}

.left-menu {
  width: 180px;
  background-color: #fff;
  padding: 20px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  margin-right: 15px;
}

.menu-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 15px;
  color: #666;
  transition: all 0.3s;
  margin: 5px 10px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-item:hover {
  color: #409eff;
  background-color: #f0f8ff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.1);
}

.menu-item.active {
  color: #fff;
  font-weight: bold;
  background-color: #409eff;
  box-shadow: 0 4px 8px rgba(64, 158, 255, 0.3);
}

.content-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.history-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}

.history-item {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.history-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.cover-container {
  position: relative;
  height: 0;
  padding-bottom: 133%;
  overflow: hidden;
}

.cover-img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.episode-tag {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 2px 6px;
  font-size: 12px;
  border-top-left-radius: 4px;
}

.item-info {
  padding: 10px;
}

.title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.update-time {
  font-size: 12px;
  color: #999;
}

.loading-container {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
}

.empty-tip {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
  background: #fff;
  border-radius: 8px;
}

.menu-count {
  background-color: rgba(255, 255, 255, 0.2);
  color: currentColor;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 12px;
  min-width: 24px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: normal;
}
</style> 