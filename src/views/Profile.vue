<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import localLoginImg from '../assets/image/localhlogin.jpg'
import {getUserInfoService} from "@/api/user.js";
import useUserInfoStore from "@/stores/userstores.js";
import { ElMessage } from 'element-plus'

const userStore = useUserInfoStore()
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
  // 检查pinia中是否有用户信息
  if (userStore.info && userStore.info.user_id) {
    isLoggedIn.value = true
    // 将pinia中的数据更新到用户信息中
    userInfo.value = {
      ...userInfo.value,
      username: userStore.info.user_name || '用户',
      avatar: userStore.info.avatar || localLoginImg
    }
  } else {
    // 尝试从localStorage中获取，用于兼容旧版本
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
}

// 获取用户信息
const getUserInfo = async () => {
  // 只有登录后才获取用户信息
  if (!isLoggedIn.value || !userStore.info.user_id) return
  
  try {
    console.log('获取用户信息参数:', userStore.info.user_id, userStore.info.user_name)
    const res = await getUserInfoService(userStore.info.user_id, userStore.info.user_name)
    if (res && res.data) {
      console.log('获取到的用户信息:', res.data)
      // 使用API返回的数据更新用户信息
      userInfo.value = {
        // 保持原有UI信息
        avatar: res.data.avatar || userStore.info.avatar || localLoginImg,
        // 使用API返回的用户昵称或用户名
        username: res.data.user_nick_name || res.data.user_name || '用户',
        // 根据用户积分计算等级，每100积分一级，最低1级
        level: res.data.user_points ? Math.max(1, Math.floor(res.data.user_points / 100)) : 1,
        // 用户积分
        coins: res.data.user_points || 0,
        // 用户组ID作为VIP等级
        vipLevel: res.data.group_id || 1,
        // 保存其他可能需要的数据
        userId: res.data.user_id,
        email: res.data.user_email,
        registerTime: res.data.user_reg_time,
        qq: res.data.user_qq,
        phone: res.data.user_phone,
        // 邀请码
        inviteCode: res.data.tgm || ''
      }
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
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
  // 清除pinia存储
  userStore.removeInfo()
  // 清除localStorage
  localStorage.removeItem('userToken')
  localStorage.removeItem('userInfo')
  
  isLoggedIn.value = false
  
  // 重置用户信息
  userInfo.value = {
    username: '登录/注册',
    avatar: localLoginImg,
    level: 5,
    vipLevel: 1,
    coins: 120
  }
}

// 复制邀请码
const copyInviteCode = () => {
  if (!userInfo.value.inviteCode) return
  
  // 创建一个临时文本区域
  const textarea = document.createElement('textarea')
  textarea.value = userInfo.value.inviteCode
  document.body.appendChild(textarea)
  
  // 选择并复制文本
  textarea.select()
  document.execCommand('copy')
  
  // 移除临时元素
  document.body.removeChild(textarea)
  
  // 显示成功消息
  ElMessage.success('邀请码已复制到剪贴板')
}

// 格式化时间戳为日期
const formatDate = (timestamp) => {
  if (!timestamp) return '未知';
  
  const date = new Date(timestamp * 1000); // 转换为毫秒
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

onMounted(() => {
  checkLoginStatus()
  getUserInfo()
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
          
          <div v-if="isLoggedIn" class="mt-1 text-sm text-gray-600">ID: {{ userInfo.userId || '未知' }}</div>
          
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
      
      <!-- 邀请码区域 -->
      <div v-if="isLoggedIn && userInfo.inviteCode" class="mt-3 p-3 bg-gray-100 rounded-lg">
        <div class="text-sm text-gray-700 font-medium">我的邀请码</div>
        <div class="flex justify-between items-center mt-1">
          <div class="text-base font-bold text-red-500">{{ userInfo.inviteCode }}</div>
          <el-button type="primary" size="small" @click="copyInviteCode">复制</el-button>
        </div>
      </div>
      
      <!-- 用户信息详情 -->
      <div v-if="isLoggedIn" class="mt-3">
        <div class="flex items-center justify-between text-sm py-2 border-b border-gray-100">
          <span class="text-gray-500">电子邮箱</span>
          <span class="text-gray-700">{{ userInfo.email || '未设置' }}</span>
        </div>
        <div class="flex items-center justify-between text-sm py-2 border-b border-gray-100">
          <span class="text-gray-500">注册时间</span>
          <span class="text-gray-700">{{ formatDate(userInfo.registerTime) }}</span>
        </div>
        <div v-if="userInfo.phone" class="flex items-center justify-between text-sm py-2 border-b border-gray-100">
          <span class="text-gray-500">手机号码</span>
          <span class="text-gray-700">{{ userInfo.phone }}</span>
        </div>
        <div v-if="userInfo.qq" class="flex items-center justify-between text-sm py-2 border-b border-gray-100">
          <span class="text-gray-500">QQ 号码</span>
          <span class="text-gray-700">{{ userInfo.qq }}</span>
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