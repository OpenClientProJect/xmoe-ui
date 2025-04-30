<script setup>
import
{ref, onMounted, computed} from 'vue'
import {useRouter} from 'vue-router'
import localLoginImg from '../assets/image/localhlogin.jpg'
import {getUserInfoService, updateUserInfoService} from "@/api/user.js";
import useUserInfoStore from "@/stores/userstores.js";
import {ElMessage} from 'element-plus'
//图标
import Collection from '../assets/icon/collection.svg'

const userStore = useUserInfoStore()
const router = useRouter()
const isLoggedIn = ref(false)

// 头像选择相关
const showAvatarDrawer = ref(false)
const avatarOptions = [
  'https://cloud.xmoe.app/227c8c7b-01.webp',
  'https://cloud.xmoe.app/227c8c7b-02.webp'
]

// 用户信息
const userInfo = ref({
  username: '登录/注册',
  avatar: isLoggedIn.value ? 'https://avatars.githubusercontent.com/u/156616301?v=4' : localLoginImg,
  coins: 0
})

// 用户统计数据
const userStats = ref({
  playCount: 0,
  favorites: 0,
  points: 0
})

// 菜单项设置 - 合并所有菜单项到一个数组
const allMenuItems = [
  {id: 1, name: '会员中心', icon: 'Medal', path: '/vip', category: 'feature'},
  {id: 2, name: '我的积分', icon: 'Money', path: '/points', category: 'feature'},
  {id: 3, name: '留言求片', icon: 'Headset', path: '/request', category: 'feature'},
  {id: 4, name: '我的追剧', icon: 'Collection', path: '/favorites', category: 'feature'},
  {id: 5, name: '个人详情', icon: 'Setting', path: '/settings/profile', category: 'setting'},
  {id: 6, name: '修改密码', icon: 'Lock', path: '/settings/password', category: 'setting'},
  {id: 7, name: '消息中心', icon: 'Bell', path: '/settings/messages', category: 'setting'},
  {id: 8, name: '清除缓存', icon: 'Delete', path: '/settings/clear-cache', category: 'setting'}
]

// 过滤出功能菜单项
const getFeatureMenuItems = computed(() => {
  return allMenuItems.filter(item => item.category === 'feature')
})

// 过滤出设置菜单项
const getSettingMenuItems = computed(() => {
  return allMenuItems.filter(item => item.category === 'setting')
})

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
      userInfo.value = {
        // 使用user_portrait作为用户头像
        avatar: res.data.user_portrait || res.data.avatar || userStore.info.avatar || localLoginImg,
        // 使用API返回的用户昵称或用户名
        username: res.data.user_nick_name || '昵称',
        // 用户积分
        coins: res.data.user_points || 0,
        // 保存其他可能需要的数据
        userId: res.data.user_id,
        email: res.data.user_email,
        registerTime: res.data.user_reg_time,
        qq: res.data.user_qq,
        phone: res.data.user_phone,
        // 邀请码
        inviteCode: res.data.tgm || ''
      }

      // 更新统计数据
      userStats.value.points = res.data.user_points || 0
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
  }
}

// 处理头像点击事件
const handleAvatarClick = () => {
  if (!isLoggedIn.value) {
    goToLogin()
    return
  }

  // 已登录状态下，打开头像选择抽屉
  showAvatarDrawer.value = true
}

// 关闭头像选择抽屉
const closeAvatarDrawer = () => {
  showAvatarDrawer.value = false
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
    coins: 0
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

// 处理菜单点击
const handleMenuClick = (path) => {
  router.push(path)
}

onMounted(() => {
  checkLoginStatus()
  getUserInfo()
})
</script>

<template>
  <div class="profile-container bg-gray-100 min-h-screen pb-20">
    <!-- 顶部用户信息区域 -->
    <div class="pt-10 pb-6 px-4 relative">
      <div class="flex items-center">
        <div class="relative">
          <img :src="userInfo.avatar" class="w-20 h-20 rounded-full border-4 border-white shadow-sm" alt="avatar"/>
        </div>
        <div @click="handleAvatarClick" class="ml-4">
          <h2 class="text-xl font-bold text-gray-800">{{ userInfo.username }}</h2>
          <p class="text-sm text-gray-500 mt-1" v-if="isLoggedIn">注册时间：{{ formatDate(userInfo.registerTime) }}</p>
        </div>
      </div>
    </div>

    <!-- 用户统计信息 -->
    <div class="bg-white flex justify-between p-5 text-center">
      <div class="flex-1">
        <div class="text-lg font-bold">{{ userStats.playCount }}</div>
        <div class="text-gray-500 text-sm">播放记录</div>
      </div>
      <div class="flex-1">
        <div class="text-lg font-bold">{{ userStats.favorites }}</div>
        <div class="text-gray-500 text-sm">我的追剧</div>
      </div>
      <div class="flex-1">
        <div class="text-lg font-bold">{{ userInfo.coins }}</div>
        <div class="text-gray-500 text-sm">我的积分</div>
      </div>
    </div>

    <!-- 邀请码区域 -->
    <div v-if="isLoggedIn && userInfo.inviteCode"
         class="mt-3 mx-3 p-4 bg-gradient-to-r from-green-400 to-blue-400 rounded-lg text-white">
      <div class="flex justify-between items-center">
        <div>
          <div class="font-medium text-base">我的邀请码：{{ userInfo.inviteCode }}</div>
          <div class="text-sm mt-1 opacity-90">成功邀请1人，可获取300积分，已邀请0人</div>
        </div>
        <div @click="copyInviteCode">
          <el-icon :size="24">
            <Copy/>
          </el-icon>
        </div>
      </div>
    </div>

    <!-- 合并后的菜单区域 -->
    <div class="bg-white rounded-md mx-3 mt-3 p-3" v-if="isLoggedIn">
      <div class="grid grid-cols-6 gap-2 flex-wrap sm:grid-cols-5 xs:grid-cols-4">
        <div v-for="item in allMenuItems" :key="item.id"
             class="flex flex-col items-center mb-3"
             @click="handleMenuClick(item.path)">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-1">
            <el-icon :size="20" class="text-gray-600">
              <component :is="item.icon"/>
            </el-icon>
          </div>
          <span class="text-xs text-center">{{ item.name }}</span>
        </div>
      </div>
    </div>

    <!-- 退出登录按钮 -->
    <div class="mx-3 mt-5 flex justify-center" v-if="isLoggedIn">
      <button @click="logout" class="bg-red-500 text-white py-3 px-10 rounded-md text-center">
        退出登录
      </button>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  padding-bottom: 60px; /* 为底部导航留出空间 */
}

/* 抽屉容器 */
.avatar-drawer-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 40;
}

/* 动画定义 */
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

/* 让页面元素有点击效果 */
.active\:bg-gray-50:active {
  background-color: #f9fafb;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .sm\:grid-cols-5 {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .xs\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .xs\:grid-cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 375px) {
  .xs\:grid-cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

/* 安全区域 - 用于iPhone X及以上机型底部黑条 */
@supports (padding: max(0px)) {
  .safe-area-bottom {
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}
</style> 