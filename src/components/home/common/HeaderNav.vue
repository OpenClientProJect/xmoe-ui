<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  tabs: {
    type: Array,
    default: () => ['推荐', '番剧', '剧场版', '4K', '待添加']
  },
  activeTab: {
    type: String,
    default: '推荐'
  },
  userAvatar: {
    type: String,
    default: 'https://avatars.githubusercontent.com/u/156616301?v=4'
  }
})

const emit = defineEmits(['tab-change'])

const router = useRouter()

// 切换标签
const changeTab = (tab) => {
  emit('tab-change', tab)
}

// 跳转到搜索页
const goToSearch = () => {
  router.push('/search')
}
</script>

<template>
  <div class="header-nav">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <div class="avatar-container">
        <img :src="userAvatar" class="avatar-img" alt="avatar" />
      </div>

      <div class="search-input" @click="goToSearch">
        <img src="../../../assets/icon/search.svg" class="search-icon" alt="search" />
        <span class="placeholder-text">搜索</span>
      </div>
      <img src="../../../assets/icon/Recording.svg" class="action-icon recording-icon" alt="recording" />
    </div>

    <!-- 分类导航栏 -->
    <div class="tab-container">
      <div
        v-for="tab in tabs"
        :key="tab"
        class="tab-item"
        :class="{'active-tab': activeTab === tab}"
        @click="changeTab(tab)"
      >
        {{ tab }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.header-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: white;
  padding-top: env(safe-area-inset-top);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.search-bar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 12px;
}

.avatar-container {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border-radius: 16px;
  padding: 8px 12px;
  cursor: pointer;
}

.search-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  opacity: 0.5;
}

.placeholder-text {
  color: #9ca3af;
  font-size: 14px;
}

.action-icon {
  width: 24px;
  height: 24px;
}

.recording-icon {
  opacity: 0.7;
}

.tab-container {
  display: flex;
  overflow-x: auto;
  padding: 0 16px 8px;
  gap: 16px;
  scrollbar-width: none; /* Firefox */
}

.tab-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.tab-item {
  white-space: nowrap;
  font-size: 14px;
  padding: 4px 0;
  cursor: pointer;
  position: relative;
}

/* 搜索栏样式 */
.search-bar {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  /* 粉色到白色的上下渐变 */
  background-image: linear-gradient(to bottom, rgba(255, 107, 139, 0.48), rgba(255, 255, 255, 1));
}

.avatar-container {
  width: 32px;
  height: 32px;
  margin-right: 8px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  padding: 6px 16px;
  cursor: pointer;
}

.search-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
}

.placeholder-text {
  color: #9ca3af;
}

.action-icon {
  margin-left: 12px;
  color: white;
}

.recording-icon {
  width: 24px;
  height: 24px;
  margin-left: 12px;
  cursor: pointer;
  filter: brightness(0) invert(1); /* 将图标改为白色 */
}

/* 标签栏样式 */
.tab-container {
  display: flex;
  overflow-x: auto;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  padding: 0;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.tab-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.tab-item {
  padding: 12px 16px;
  font-size: 14px;
  white-space: nowrap;
  position: relative;
  color: #333;
}

.active-tab {
  color: #dc2626;
  font-weight: 600;
  border-bottom: 2px solid #dc2626;
}


</style>
