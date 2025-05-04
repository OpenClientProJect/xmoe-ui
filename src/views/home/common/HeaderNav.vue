<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {getMenuListService} from "@/api/home/anime.js";
import useUserInfoStore from "@/stores/userstores.js";

import Loading from '@/assets/gif/loading.gif'
import {getUserInfoService} from "@/api/user.js";
import { ElMessage } from 'element-plus'

const props = defineProps({
  activeTab: {
    type: String,
    default: '推荐'
  },
  hideInVideoDetail: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['tab-change'])

const router = useRouter()
const userStore = useUserInfoStore()
const menuList = ref([])
const subMenuList = ref([])
const isLoading = ref(false)
const showSubMenu = ref(false)
const userAvatar = ref(Loading) // 默认使用Loading图片作为头像

// 获取用户信息
const getUserInfo = async () => {
  try {
    // 检查用户是否已登录
    if (userStore.info && userStore.info.user_id) {
      const res = await getUserInfoService(userStore.info.user_id)
        // 如果接口返回了用户头像，则使用返回的头像
        if (res.data.user_portrait) {
          userAvatar.value = res.data.user_portrait
        }
    } else {
      // 未登录时使用默认头像
      userAvatar.value = Loading
    }
  } catch (error) {
    console.error('获取用户信息失败:', error)
    // 出错时使用默认头像
    userAvatar.value = Loading
  }
}

// 点击头像处理
const handleAvatarClick = () => {
  // 已登录则跳转到个人主页，未登录则跳转到登录页
  if (userStore.info && userStore.info.user_id) {
    router.push('/profile')
  } else {
    router.push('/login')
  }
}

// 切换标签
const changeTab = (tab) => {
  emit('tab-change', tab)

  // 根据标签名称跳转到对应路由
  if (tab === '推荐') {
    router.push('/')
    showSubMenu.value = false
  } else if (tab === '番剧') {
    router.push('/anime')
  } else if (tab === '剧场版') {
    router.push('/movie')
  } else if (tab === '4K') {
    router.push('/4k')
    showSubMenu.value = false
  } else if (tab === '待添加') {
    router.push('/resources')
    showSubMenu.value = false
  } else {
    // 其他动态菜单项，暂时跳转到首页
    router.push('/')
    showSubMenu.value = false
  }
}


// 跳转到搜索页
const goToSearch = () => {
  router.push('/search')
}

// 跳转到播放记录页面
const goToHistory = () => {
  // 检查用户是否登录
  if (userStore.info && userStore.info.user_id) {
    router.push({
      path: `/history/${userStore.info.user_id}`,
      query: { tab: 'history' }
    });
  } else {
    ElMessage.warning('请先登录');
    router.push('/login');
  }
}

// 获取菜单列表
const getMenuList = async () => {
  try {
    isLoading.value = true
    const res = await getMenuListService()
    menuList.value = res.data
  } finally {
    isLoading.value = false // 结束加载
  }
}

onMounted(() => {
  getMenuList()
  getUserInfo() // 组件挂载时获取用户信息
})
</script>

<template>
  <div class="header-nav" :class="{ 'hidden': hideInVideoDetail }">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <div class="avatar-container" @click="handleAvatarClick">
        <img :src="userAvatar" class="avatar-img" alt="avatar"/>
      </div>

      <div class="search-input" @click="goToSearch">
        <img src="../../../assets/icon/search.svg" class="search-icon" alt="search"/>
        <span class="placeholder-text">搜索</span>
      </div>
      <img src="../../../assets/icon/Recording.svg" @click="goToHistory" class="action-icon recording-icon" alt="recording"/>
    </div>

    <!-- 分类导航栏 -->
    <div class="tab-container">
      <!-- 固定的"推荐"选项 -->
      <div
          class="tab-item"
          :class="{'active-tab': activeTab === '推荐'}"
          @click="changeTab('推荐')"
      >
        推荐
      </div>

      <!-- 固定的"番剧"选项 -->
      <div
          class="tab-item"
          :class="{'active-tab': activeTab === '番剧'}"
          @click="changeTab('番剧')"
      >
        番剧
      </div>

      <!-- 固定的"剧场版"选项 -->
      <div
          class="tab-item"
          :class="{'active-tab': activeTab === '剧场版'}"
          @click="changeTab('剧场版')"
      >
        剧场版
      </div>

      <!-- 固定的"4K"选项 -->
      <div
          class="tab-item"
          :class="{'active-tab': activeTab === '4K'}"
          @click="changeTab('4K')"
      >
        4K
      </div>

      <!-- 固定的"待添加"选项 -->
      <div
          class="tab-item"
          :class="{'active-tab': activeTab === '待添加'}"
          @click="changeTab('待添加')"
      >
        待添加
      </div>

      <!-- 动态加载的菜单项 -->
      <div
          v-for="item in menuList"
          :key="item.type_id"
          class="tab-item"
          :class="{'active-tab': activeTab === item.type_name}"
          @click="changeTab(item.type_name)"
      >
        {{ item.type_name }}
      </div>

      <!-- 加载中提示 -->
      <div v-if="isLoading" class="tab-item loading-tab">
        加载中...
      </div>
    </div>

    <!-- 子分类导航栏 -->
    <div v-if="showSubMenu && subMenuList.length > 0" class="sub-menu-container">
      <div
          v-for="item in subMenuList"
          :key="item.type_id"
          class="sub-menu-item"
          @click="router.push(`${activeTab === '番剧' ? '/anime' : '/movie'}?typeId=${item.type_id}`)"
      >
        {{ item.type_name }}
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

.header-nav.hidden {
  display: none;
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
  width: 24px;
  height: 24px;
  margin-left: 12px;
  cursor: pointer;
  filter: brightness(0) invert(1); /* 将图标改为白色 */
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

.loading-tab {
  color: #9ca3af;
  font-style: italic;
}

/* 子分类导航栏样式 */
.sub-menu-container {
  display: flex;
  overflow-x: auto;
  background-color: #f9f9f9;
  padding: 8px 16px;
  border-bottom: 1px solid #eee;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.sub-menu-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Edge */
}

.sub-menu-item {
  padding: 6px 12px;
  font-size: 13px;
  white-space: nowrap;
  color: #666;
  background-color: #fff;
  border-radius: 16px;
  margin-right: 10px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.sub-menu-item:hover {
  background-color: #f0f0f0;
  color: #dc2626;
}
</style>
