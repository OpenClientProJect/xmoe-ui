<script setup>
import { ref, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getUserInfoService, updateUserInfoService } from "@/api/user.js"
import useUserInfoStore from "@/stores/userstores.js"
import { ArrowLeft } from "@element-plus/icons-vue"

const router = useRouter()
const userStore = useUserInfoStore()

// 表单数据
const userForm = reactive({
  username: '', // 用户名
  nickname: '', // 昵称
  user_portrait: '', // 头像
})

// 原始用户数据，用于比较是否有修改
const originalUserData = ref({})

// 页面加载状态
const loading = ref(false)
// 提交状态
const submitting = ref(false)
// 显示头像选择抽屉
const showAvatarDrawer = ref(false)

// 头像选项
const avatarOptions = [
  'https://cloud.xmoe.app/227c8c7b-01.webp',
  'https://cloud.xmoe.app/227c8c7b-02.webp'
]

// 回到个人中心
const goBack = () => {
  router.push('/profile')
}

// 获取用户信息
const getUserInfo = async () => {
  if (!userStore.info || !userStore.info.user_id) {
    ElMessage.warning('请先登录')
    await router.push('/login')
    return
  }
  
  loading.value = true
  
  try {
    const res = await getUserInfoService(userStore.info.user_id, userStore.info.user_name)
    if (res && res.data) {
      console.log('获取到的用户信息:', res.data)
      
      // 更新表单数据
      userForm.username = res.data.user_name || ''
      userForm.nickname = res.data.user_nick_name || ''
      userForm.user_portrait = res.data.user_portrait || ''

      // 保存原始数据，用于比较是否有修改
      originalUserData.value = {...userForm}
    }
  } catch (error) {
    console.error('获取用户信息失败', error)
    ElMessage.error('获取用户信息失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

// 是否有修改
const hasChanged = () => {
  return JSON.stringify(userForm) !== JSON.stringify(originalUserData.value)
}

// 提交表单
const submitForm = async () => {
  // 检查是否有修改
  if (!hasChanged()) {
    ElMessage.info('没有修改任何信息')
    return
  }
  
  submitting.value = true
  
  try {
    const params = {
      user_id: userStore.info.user_id,
      user_nick_name: userForm.nickname,
      user_portrait: userForm.user_portrait
    }
    await updateUserInfoService(params)
    ElMessage.success('个人信息更新成功')
    //跳转个人中心
    await router.push('/profile')
  } finally {
    submitting.value = false
  }
}

// 打开头像选择抽屉
const openAvatarDrawer = () => {
  showAvatarDrawer.value = true
  // 禁止底层页面滚动
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
  document.body.style.top = `-${window.scrollY}px`
}

// 关闭头像选择抽屉
const closeAvatarDrawer = () => {
  showAvatarDrawer.value = false
  // 恢复底层页面滚动
  const scrollY = document.body.style.top
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
  document.body.style.top = ''
  window.scrollTo(0, parseInt(scrollY || '0') * -1)
}

// 选择头像
const selectAvatar = (avatarUrl) => {
  userForm.user_portrait = avatarUrl
  closeAvatarDrawer()
}

// 禁止页面滚动
const disablePageScroll = () => {
  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
  document.body.style.height = '100%'
}

onMounted(() => {
  getUserInfo()
  // 在组件挂载时禁止页面滚动
  disablePageScroll()
})
</script>

<template>
  <div class="user-settings fixed inset-0 bg-white overflow-hidden">
    <!-- 顶部导航栏 -->
    <div class="py-3 px-4 flex items-center sticky top-0 z-10 bg-white text-black border-b border-gray-100">
      <div @click="goBack" class="flex items-center">
        <el-icon :size="20">
          <ArrowLeft />
        </el-icon>
      </div>
      <div class="flex-1 text-center text-lg font-medium">个人详情</div>
      <div class="w-5"></div><!-- 占位，保持标题居中 -->
    </div>
    
    <!-- 主要内容区域 -->
    <div class="bg-white h-full flex flex-col overflow-auto">
      <div v-if="loading" class="text-center py-8 flex-grow">
        <el-icon class="is-loading" :size="24">
          <Loading />
        </el-icon>
        <p class="mt-2 text-gray-600">加载中...</p>
      </div>
      
      <template v-else>
        <!-- 头像区域 -->
        <div class="flex flex-col items-center py-10">
          <div class="relative group cursor-pointer" @click="openAvatarDrawer">
            <img 
              :src="userForm.user_portrait" 
              class="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              alt="用户头像"
            />
            <div class="absolute bottom-0 left-0 w-full h-1/2 bg-black bg-opacity-30 backdrop-blur-[1px] rounded-b-full flex items-center justify-center">
              <span class="text-white text-xs flex items-center">
                更换头像
              </span>
            </div>
          </div>
        </div>
        
        <!-- 表单区域 -->
        <div class="mt-10 flex justify-center mb-6 flex-grow">
          <div class="relative mb-4 w-4/5">
            <input 
              v-model="userForm.nickname"
              placeholder="输入为空时，不会修改原有昵称"
              class="w-full p-3 px-5 bg-gray-100 rounded-full focus:outline-none text-[#f75f5f] text-center placeholder:text-gray-400 placeholder:text-sm text-sm"
            />
          </div>
        </div>
      </template>
    </div>
    
    <!-- 确定按钮（固定在底部） -->
    <div class="fixed bottom-0 left-0 right-0 bg-white py-5 px-4 border-t border-gray-100 flex justify-center safe-area-bottom">
      <button 
        @click="submitForm" 
        :disabled="!hasChanged() || submitting"
        class="px-20 py-3 rounded-full text-white font-normal text-lg bg-[#ff6665] disabled:bg-[#ffb4b3] w-full max-w-md">
        完成
      </button>
    </div>
    
    <!-- 头像选择抽屉 -->
    <div class="avatar-drawer-container" v-if="showAvatarDrawer">
      <!-- 遮罩层 -->
      <div 
        class="fixed inset-0 bg-black bg-opacity-40 z-40 animate-fade-in" 
        @click="closeAvatarDrawer"
      ></div>
      
      <!-- 抽屉内容 -->
      <div class="fixed bottom-0 left-0 w-full bg-white rounded-t-xl z-50 animate-slide-up max-h-[80vh] overflow-hidden flex flex-col">
        <!-- 抽屉头部 -->
        <div class="flex justify-between items-center px-4 py-4 border-b">
          <h3 class="text-lg font-medium">选择头像</h3>
          <button @click="closeAvatarDrawer" class="text-gray-500 h-8 w-8 flex items-center justify-center">
            <span class="text-xl">×</span>
          </button>
        </div>
        
        <!-- 头像列表 -->
        <div class="p-4 py-6 grid grid-cols-3 gap-6 overflow-y-auto flex-grow">
          <div 
            v-for="(avatar, index) in avatarOptions" 
            :key="index"
            class="avatar-item flex justify-center mb-4"
          >
            <img 
              :src="avatar"
              class="w-28 h-28 rounded-full object-cover border-2 border-gray-200 hover:border-red-500 transition-all cursor-pointer animate-fade-in"
              :style="`animation-delay: ${100 + index * 50}ms`"
              @click="selectAvatar(avatar)"
              alt=""/>
          </div>
        </div>
        
        <!-- 底部安全区域 -->
        <div class="h-8 bg-white safe-area-bottom"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 移除iOS上输入框的默认样式 */
input {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

/* 抽屉容器 */
.avatar-drawer-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 40;
  overscroll-behavior: contain; /* 阻止滚动传递到下层元素 */
  touch-action: none; /* 禁止触摸操作传递 */
}

/* 抽屉内容区域样式 */
.avatar-drawer-container .fixed.bottom-0 {
  overscroll-behavior: contain; /* 防止过度滚动影响外层 */
  -webkit-overflow-scrolling: touch; /* 平滑滚动 */
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

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.avatar-item img {
  animation: zoomIn 0.3s ease-out forwards;
  transition: transform 0.2s, border-color 0.2s;
}

.avatar-item img:hover {
  transform: scale(1.05);
  border-color: #ff6665;
  box-shadow: 0 3px 10px rgba(255, 102, 101, 0.2);
}

/* 安全区域 - 用于iPhone X及以上机型底部黑条 */
@supports (padding: max(0px)) {
  .safe-area-bottom {
    padding-bottom: max(env(safe-area-inset-bottom, 16px), 60px);
  }
}

/* 禁止页面滚动 */
.user-settings {
  overscroll-behavior: none;
  touch-action: none;
}

/* 确保内容可滚动区域有正确的底部间距，避免被底部按钮遮挡 */
.user-settings .bg-white.h-full {
  padding-bottom: 120px;
}
</style> 