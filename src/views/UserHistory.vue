<script setup>
import {onMounted, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {getHistoryListService} from "@/api/user.js"
import {ElMessage} from 'element-plus'
import useUserInfoStore from "@/stores/userstores.js"
import {ArrowLeft} from "@element-plus/icons-vue";

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

// 初始化用户ID和激活标签
onMounted(() => {
  // 检查是否有用户ID
  if (!userId.value) {
    ElMessage.warning('未找到用户信息，请先登录')
    router.push('/login')
    return
  }

  // 检查是否有指定标签
  if (route.query.tab) {
    // 设置激活标签
    activeTab.value = route.query.tab
  }

  // 根据激活标签加载对应数据
  if (activeTab.value === 'history') {
    getPlayHistory()
  } else if (activeTab.value === 'collect') {
    getCollectList()
  }
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
      duration: item.duration || '',
      content: item.vod_content || '' // 添加内容简介字段
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
      duration: item.duration || '',
      content: item.vod_content || '' // 添加内容简介字段
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

// 格式化时长显示
const getFormattedDuration = (duration) => {
  // 如果没有时长数据，返回空字符串
  if (!duration) return '';
  return duration;
}
</script>

<template>
  <div class="user-history">
    <!-- 移动端顶部导航栏 -->
    <div class="mobile-nav">
      <div class="mobile-back" @click="goBack">
        <el-icon>
          <ArrowLeft/>
        </el-icon>
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
        <el-icon>
          <ArrowLeft/>
        </el-icon>
        <span>返回</span>
      </div>

      <div class="menu-divider"></div>

      <div
          class="menu-item"
          :class="{ active: activeTab === 'history' }"
          @click="switchTab('history')"
      >
        <span>播放记录</span>
        <span v-if="activeTab === 'history'" class="menu-count">{{ playHistoryList.length || 0 }}</span>
      </div>
      <div
          class="menu-item"
          :class="{ active: activeTab === 'collect' }"
          @click="switchTab('collect')"
      >
        <span>我的追剧</span>
        <span v-if="activeTab === 'collect'" class="menu-count">{{ collectList.length || 0 }}</span>
      </div>
    </div>

    <!-- 右侧内容 -->
    <div class="content-area">
      <div v-if="loading" class="loading-container">
        <el-skeleton :rows="5" animated/>
      </div>

      <div v-else-if="activeTab === 'history' && playHistoryList.length === 0" class="empty-tip">
        暂无播放记录
      </div>

      <div v-else-if="activeTab === 'collect' && collectList.length === 0" class="empty-tip">
        暂无追剧记录
      </div>

      <div v-else-if="activeTab === 'history'" class="history-list">
        <!-- 桌面端版本 -->
        <div v-for="item in playHistoryList" :key="item.id" class="history-item desktop-history-item"
             @click="goToVideoDetail(item.id)">
          <div class="desktop-item-container">
            <div class="cover-container">
              <img
                  src="@/assets/gif/loading.gif"
                  alt="封面"
                  class="cover-img animated"
              >
            </div>
            <div class="desktop-info">
              <h3 class="desktop-title" :title="item.title">{{ item.title }}</h3>
              <p class="desktop-desc" v-if="item.content">{{ item.content }}</p>
              <div class="desktop-meta">
                <span class="episode-label">{{ item.episode }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端版本 -->
        <div v-for="item in playHistoryList" :key="`mobile-${item.id}`" class="mobile-history-item"
             @click="goToVideoDetail(item.id)">
          <div class="cover-wrapper">
            <img
                src="@/assets/gif/loading.gif"
                alt="封面"
                class="cover-img"
            >
          </div>
          <div class="info-wrapper">
            <h3 class="video-title" :title="item.title">{{ item.title }}</h3>
            <p class="video-desc" v-if="item.content">{{ item.content }}</p>
            <div class="video-info">
              <span class="episode-num">{{ item.episode }}</span>
              <span class="time-mark">{{ getFormattedDuration(item.duration) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'collect'" class="history-list">
        <!-- 桌面端版本 -->
        <div v-for="item in collectList" :key="item.id" class="history-item desktop-history-item"
             @click="goToVideoDetail(item.id)">
          <div class="desktop-item-container">
            <div class="cover-container">
              <img
                  src="@/assets/gif/loading.gif"
                  alt="封面"
                  class="cover-img animated"
              >
            </div>
            <div class="desktop-info">
              <h3 class="desktop-title" :title="item.title">{{ item.title }}</h3>
              <p class="desktop-desc" v-if="item.content">{{ item.content }}</p>
              <div class="desktop-meta">
                <span class="episode-label">{{ item.episode }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端版本 -->
        <div v-for="item in collectList" :key="`mobile-${item.id}`" class="mobile-history-item"
             @click="goToVideoDetail(item.id)">
          <div class="cover-wrapper">
            <img
                src="@/assets/gif/loading.gif"
                alt="封面"
                class="cover-img"
            >
          </div>
          <div class="info-wrapper">
            <h3 class="video-title" :title="item.title">{{ item.title }}</h3>
            <p class="video-desc" v-if="item.content">{{ item.content }}</p>
            <div class="video-info">
              <span class="episode-num">{{ item.episode }}</span>
              <span class="time-mark">{{ getFormattedDuration(item.duration) }}</span>
            </div>
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
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.desktop-history-item {
  display: block;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.desktop-history-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.desktop-item-container {
  display: flex;
  height: 100%;
}

.cover-container {
  position: relative;
  width: 120px;
  height: 160px;
  flex-shrink: 0;
}

.cover-img {
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

.desktop-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.desktop-title {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 10px 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.desktop-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 10px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  flex: 1;
}

.desktop-meta {
  font-size: 12px;
  color: #999;
  margin-top: auto;
}

.episode-label {
  background-color: #f0f0f0;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
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

/* 重新设计历史项在移动端的样式 */
.mobile-history-item {
  display: none;
  background-color: #fff;
  border-radius: 0;
  overflow: hidden;
  box-shadow: none;
  margin-bottom: 0;
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 15px;
  height: auto;
  min-height: 90px;
}

.info-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  padding: 0;
}

.cover-wrapper {
  position: relative;
  width: 120px;
  height: 70px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 4px; /* 只给封面添加圆角 */
  margin-right: 12px;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-time {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 2px;
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin: 0;
  padding: 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

.video-desc {
  font-size: 12px;
  color: #666;
  margin: 6px 0 0;
  padding: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: 2.6em;
}

.video-info {
  font-size: 12px;
  color: #999;
  margin-top: auto;
  padding-top: 6px;
  display: flex;
  align-items: center;
}

.episode-num {
  margin-right: 10px;
}

.time-mark {
  color: #999;
}

/* 移动端优化 */
@media (max-width: 768px) {
  .content-area {
    padding: 0;
  }

  .history-list {
    display: block;
    padding: 0;
  }

  .mobile-history-item {
    display: flex;
  }

  .desktop-history-item {
    display: none;
  }

  .empty-tip {
    margin: 20px 15px;
    text-align: center;
    padding: 30px 0;
  }
}

.desktop-history-item {
  display: block; /* 默认显示桌面端样式 */
}

@media (max-width: 768px) {
  .desktop-history-item {
    display: none; /* 移动端隐藏桌面版本 */
  }
}
</style> 