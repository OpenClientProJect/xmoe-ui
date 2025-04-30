<script setup>
import {onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {getHistoryListService} from "@/api/user.js"
import {ElMessage} from 'element-plus'
import useUserInfoStore from "@/stores/userstores.js"

const router = useRouter()
const route = useRoute()
const userStore = useUserInfoStore()

// 获取用户ID，从路由参数中获取或使用当前登录用户的ID
const userId = ref(route.params.userId || (userStore.info ? userStore.info.user_id : null))

// 数据
const activeTab = ref('history') // 默认显示播放历史
const loading = ref(false)
const playHistoryList = ref([])
const collectList = ref([])

// 初始化用户ID
onMounted(() => {
  // 检查是否有用户ID
  if (!userId.value) {
    ElMessage.warning('未找到用户信息，请先登录')
    router.push('/login')
    return
  }
  
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
  loading.value = true
  try {
    const res = await getHistoryListService({
      user_id: userId.value,
      ulog_type: 4 // 播放历史类型为4
    })

    // 适配新的数据格式
    playHistoryList.value = res.data.map(item => ({
      id: item.vod_id,
      title: item.vod_name,
      // 统一使用gif动画作为封面
      cover: '@/assets/gif/loading.gif',
      episode: item.vod_remarks || '全集',
    }))
  } finally {
    loading.value = false
  }
}

// 获取追剧列表
const getCollectList = async () => {
  loading.value = true
  try {
    const res = await getHistoryListService({
      user_id: userId.value,
      ulog_type: 2 // 追剧类型为2
    })

    // 适配新的数据格式
    collectList.value = res.data.map(item => ({
      id: item.vod_id,
      title: item.vod_name,
      cover: '@/assets/gif/loading.gif',
      episode: item.vod_remarks || '全集',
    }))
  } finally {
    loading.value = false
  }
}

// 跳转到详情页
const goToVideoDetail = (id) => {
  router.push(`/video/${id}`)
}

// 返回上一页
const goBack = () => {
  router.back()
}
</script>

<template>
  <div class="user-history">
    <!-- 移动端顶部导航栏 -->
    <div class="mobile-nav">
      <div class="mobile-back" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
      </div>
      <div class="mobile-title">
        用户记录
      </div>
      <div class="mobile-placeholder"></div>
    </div>
    
    <!-- 移动端标签切换 -->
    <div class="mobile-tabs">
      <div 
        class="mobile-tab"
        :class="{ active: activeTab === 'history' }"
        @click="switchTab('history')"
      >
        播放记录
      </div>
      <div 
        class="mobile-tab"
        :class="{ active: activeTab === 'collect' }"
        @click="switchTab('collect')"
      >
        我的追剧
      </div>
    </div>
    
    <!-- 左侧菜单 -->
    <div class="left-menu">
      <!-- 返回按钮 -->
      <div class="back-button" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>返回</span>
      </div>
      
      <div class="menu-divider"></div>
      
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
            <img 
              src="@/assets/gif/loading.gif" 
              alt="封面" 
              class="cover-img animated"
            >
            <div class="episode-tag">{{item.episode}}</div>
          </div>
          <div class="item-info">
            <div class="title">{{item.title}}</div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'collect'" class="history-list">
        <div v-for="item in collectList" :key="item.id" class="history-item" @click="goToVideoDetail(item.id)">
          <div class="cover-container">
            <img 
              src="@/assets/gif/loading.gif" 
              alt="封面" 
              class="cover-img animated"
            >
            <div class="episode-tag">{{item.episode}}</div>
          </div>
          <div class="item-info">
            <div class="title">{{item.title}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 移动端顶部导航栏 */
.mobile-nav {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 12px 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  /* 默认隐藏移动端导航 */
  display: none;
}

.mobile-back {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.mobile-title {
  font-size: 16px;
  font-weight: bold;
}

.mobile-placeholder {
  width: 36px;
}

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

/* 返回按钮样式 */
.back-button {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  margin: 0 10px 10px;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s;
}

.back-button:hover {
  background-color: #f0f0f0;
  color: #409eff;
}

.back-button .el-icon {
  margin-right: 8px;
  font-size: 16px;
}

/* 分割线 */
.menu-divider {
  height: 1px;
  background-color: #eaeaea;
  margin: 5px 15px 15px;
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

/* 响应式处理 */
@media (max-width: 768px) {
  .mobile-nav {
    display: flex;
  }
  
  .user-history {
    flex-direction: column;
    padding-top: 0;
  }
  
  .left-menu {
    display: none; /* 在移动端隐藏左侧菜单 */
  }
  
  .content-area {
    padding: 15px;
  }
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

.animated {
  background-color: #f0f0f0;
  filter: contrast(1.1);
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

/* 移动端标签切换 */
.mobile-tabs {
  display: none;
  background-color: #fff;
  margin-bottom: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.mobile-tab {
  padding: 12px 0;
  text-align: center;
  font-size: 15px;
  color: #666;
  cursor: pointer;
  position: relative;
  flex: 1;
}

.mobile-tabs {
  display: none;
  flex-direction: row;
}

.mobile-tab.active {
  color: #409eff;
  font-weight: bold;
}

.mobile-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 25%;
  width: 50%;
  height: 3px;
  background-color: #409eff;
  border-radius: 3px;
}

@media (max-width: 768px) {
  .mobile-tabs {
    display: flex;
  }
}
</style> 