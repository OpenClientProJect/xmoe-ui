<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import localLoginImg from '../assets/image/localhlogin.jpg'

const router = useRouter()
const isLoggedIn = ref(false)

// 用户信息
const userInfo = ref({
  username: '登录/注册',
  avatar: isLoggedIn.value ? 'https://avatars.githubusercontent.com/u/156616301?v=4' : localLoginImg,
  level: 5,
  vipLevel: 1,
  coins: 120
})

// 菜单项
const menuItems = [
  { id: 1, name: '稍后再看', icon: 'el-icon-video-play', count: 12 },
  { id: 2, name: '历史记录', icon: 'el-icon-time', count: 89 },
  { id: 3, name: '我的收藏', icon: 'el-icon-star', count: 23 },
  { id: 4, name: '离线缓存', icon: 'el-icon-download', count: 4 }
]

const settingsItems = [
  { id: 1, name: '设置', icon: 'el-icon-setting' },
  { id: 2, name: '主题', icon: 'el-icon-brush' },
  { id: 3, name: '关于我们', icon: 'el-icon-info-filled' },
  { id: 4, name: '意见反馈', icon: 'el-icon-chat-dot-round' }
]

// 跳转到登录页面
const goToLogin = () => {
  router.push('/login')
}

// 检查用户登录状态
const checkLoginStatus = () => {
  const token = localStorage.getItem('userToken')
  const storedUserInfo = localStorage.getItem('userInfo')
  
  if (token && storedUserInfo) {
    isLoggedIn.value = true
    try {
      const parsedUserInfo = JSON.parse(storedUserInfo)
      // 合并存储的用户信息和默认信息
      userInfo.value = {
        ...userInfo.value,
        ...parsedUserInfo
      }
    } catch (e) {
      console.error('解析用户信息失败', e)
    }
  } else {
    isLoggedIn.value = false
    // 更新未登录状态下的头像
    userInfo.value.avatar = localLoginImg
  }
}

// 处理头像点击事件
const handleAvatarClick = () => {
  if (!isLoggedIn.value) {
    goToLogin()
  }
}

// 退出登录
const logout = () => {
  localStorage.removeItem('userToken')
  localStorage.removeItem('userInfo')
  isLoggedIn.value = false
  
  // 重置用户信息
  userInfo.value = {
    username: '小萌新',
    avatar: localLoginImg,
    level: 5,
    vipLevel: 1,
    coins: 120
  }
}

onMounted(() => {
  checkLoginStatus()
})
</script>

<template>
  <div class="profile-container pb-16">
    <!-- 个人信息 -->
    <div class="p-4">
      <div class="flex items-center">
        <div class="relative" @click="handleAvatarClick">
          <img :src="userInfo.avatar" class="w-16 h-16 rounded-full border-2 border-gray-200" alt="avatar" />
          <div v-if="isLoggedIn" class="absolute -bottom-1 -right-1 bg-yellow-400 text-xs text-black font-medium px-1 rounded-full">
            Lv.{{ userInfo.level }}
          </div>
        </div>
        
        <div class="ml-3">
          <div class="flex items-center">
            <h2 class="text-lg font-medium text-gray-800">{{ userInfo.username }}</h2>
            <div v-if="isLoggedIn" class="ml-2 px-2 py-0.5 bg-yellow-500 text-xs rounded-full text-black flex items-center">
              <el-icon class="mr-0.5"><el-icon-crown /></el-icon>
              <span>会员{{ userInfo.vipLevel }}</span>
            </div>
          </div>
          
          <div v-if="isLoggedIn" class="mt-1 text-sm text-gray-600">XMoe ID: 8901234</div>
          
          <div v-if="isLoggedIn" class="mt-2 flex items-center">
            <div class="px-2 py-1 bg-gray-200 rounded-full flex items-center mr-2">
              <el-icon class="mr-1 text-gray-700"><el-icon-coin /></el-icon>
              <span class="text-xs text-gray-700">{{ userInfo.coins }}</span>
            </div>
            <div class="px-2 py-1 bg-gray-200 rounded-full text-xs text-gray-700">
              等级 {{ userInfo.level }}
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- 功能菜单 -->
    <div class="bg-white mt-3">
      <div class="p-3 text-base font-medium border-b">我的功能</div>
      <div class="grid grid-cols-4">
        <div 
          v-for="item in menuItems" 
          :key="item.id"
          class="flex flex-col items-center py-4 relative"
        >
          <el-icon :size="24" class="text-red-500"><component :is="item.icon" /></el-icon>
          <div class="text-sm mt-1">{{ item.name }}</div>
          <div 
            v-if="item.count" 
            class="absolute top-3 right-1/4 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
          >
            {{ item.count > 99 ? '99+' : item.count }}
          </div>
        </div>
      </div>
    </div>
    
    <!-- 设置 -->
    <div class="bg-white mt-3">
      <div class="p-3 text-base font-medium border-b">设置与帮助</div>
      <div class="divide-y">
        <div 
          v-for="item in settingsItems" 
          :key="item.id"
          class="flex items-center justify-between p-4"
        >
          <div class="flex items-center">
            <el-icon :size="20" class="text-gray-500 mr-3"><component :is="item.icon" /></el-icon>
            <span>{{ item.name }}</span>
          </div>
          <el-icon class="text-gray-400"><el-icon-arrow-right /></el-icon>
        </div>
      </div>
    </div>
    
    <!-- 退出登录 -->
    <div class="p-4">
      <el-button class="w-full" plain @click="logout" v-if="isLoggedIn">退出登录</el-button>
      <el-button class="w-full" type="primary" @click="goToLogin" v-else>登录 / 注册</el-button>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style> 