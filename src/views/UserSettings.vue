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
  email: '',    // 邮箱
})

// 原始用户数据，用于比较是否有修改
const originalUserData = ref({})

// 页面加载状态
const loading = ref(false)
// 提交状态
const submitting = ref(false)

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
      userForm.email = res.data.user_email || ''
      userForm.qq = res.data.user_qq || ''
      userForm.phone = res.data.user_phone || ''
      
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
      user_name: userForm.username,
      user_nick_name: userForm.nickname,
      user_email: userForm.email,
      user_qq: userForm.qq,
      user_phone: userForm.phone
    }
    
    const res = await updateUserInfoService(params)
    
    if (res && res.code === 200) {
      ElMessage.success('个人信息更新成功')
      
      // 更新Pinia中的用户信息
      userStore.updateUserInfo({
        user_name: userForm.username,
        user_nick_name: userForm.nickname
      })
      
      // 更新原始数据
      originalUserData.value = {...userForm}
    } else {
      ElMessage.error(res?.msg || '更新失败，请稍后重试')
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    ElMessage.error('更新失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}


onMounted(() => {
  getUserInfo()
})
</script>

<template>
  <div class="user-settings min-h-screen bg-green-500">
    <!-- 顶部导航栏 - 微信绿色风格 -->
    <div class="py-3 px-4 flex items-center sticky top-0 z-10 bg-green-500 text-white">
      <div @click="goBack" class="flex items-center">
        <el-icon :size="20">
          <ArrowLeft />
        </el-icon>
      </div>
      <div class="flex-1 text-center text-xl font-normal">个人设置</div>
      <div class="w-5"></div><!-- 占位，保持标题居中 -->
    </div>
    
    <!-- 主要内容区域 -->
    <div class="bg-gray-100 min-h-screen pt-2">
      <div v-if="loading" class="text-center py-8">
        <el-icon class="is-loading" :size="24">
          <Loading />
        </el-icon>
        <p class="mt-2 text-gray-600">加载中...</p>
      </div>
      
      <template v-else>
        <!-- 表单区域 - 模仿微信的设置项样式 -->
        <div class="bg-white">
          <!-- 邮箱 -->
          <div class="px-4 py-4 flex items-center border-b border-gray-100">
            <label class="text-gray-800 ">邮箱：</label>
            <span class="text-gray-500">{{ userForm.email || "" }}</span>
          </div>
          
          <!-- 用户名 -->
          <div class="px-4 py-4 flex items-center border-b border-gray-100">
            <label class="text-gray-800 ">用户名：</label>
            <span class="text-gray-500">{{ userForm.username }}</span>
          </div>
          
          <!-- 昵称 -->
          <div class="px-4 py-4 border-b border-gray-100">
            <div class="flex items-center">
              <label class="text-gray-800 w-20">昵称</label>
            </div>
            <div >
              <input 
                v-model="userForm.nickname" 
                placeholder="设置昵称" 
                class="border-none text-black font-bold focus:outline-none bg-transparent flex-1"
              />
            </div>
          </div>
        </div>
        
        <!-- QQ号部分 - 独立部分 -->
        <div class="bg-white mt-2">
          <div class="px-4 py-4 flex items-center">
            <label class="text-gray-800 w-20">QQ号</label>
            <input 
              v-model="userForm.qq" 
              placeholder="未设置" 
              class="border-none text-gray-600 focus:outline-none bg-transparent flex-1"
            />
          </div>
        </div>

        <!-- 确定按钮 - 绿色风格 -->
        <div class="mt-8 px-4">
          <button 
            @click="submitForm" 
            :disabled="!hasChanged() || submitting"
            class="w-full py-3 rounded-md text-white font-normal text-lg bg-green-500 disabled:bg-green-300">
            确定
          </button>
        </div>
      </template>
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
</style> 