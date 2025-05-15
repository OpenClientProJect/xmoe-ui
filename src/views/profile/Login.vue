<script setup>
import {ref, reactive, onUnmounted, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import localLoginImg from '../../assets/image/login.jpg'
import {registerService, sendCodeService, loginService} from "@/api/login.js";
import {ElMessage} from 'element-plus'
import useUserInfoStore from '@/stores/userstores.js'

const userStore = useUserInfoStore()
const router = useRouter()
const isLogin = ref(true) // true为登录页面，false为注册页面
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false) // 添加loading状态
const countdown = ref(0) // 倒计时秒数
let timer = null // 计时器

// 保存原始样式的变量
let originalOverflow
let originalHeight

// 组件挂载时设置样式
onMounted(() => {
  // 保存原始样式
  originalOverflow = document.body.style.overflow
  originalHeight = document.body.style.height
  
  // 设置新样式
  document.body.style.overflow = 'hidden'
  document.body.style.height = '100%'
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.style.height = '100%'
})

// 组件卸载时恢复样式和清除计时器
onUnmounted(() => {
  document.body.style.overflow = originalOverflow
  document.body.style.height = originalHeight
  document.documentElement.style.overflow = ''
  document.documentElement.style.height = ''
  clearInterval(timer)
})

// 表单数据
const formData = reactive({
  email: '',
  password: '',
  confirmPassword: '',
  code: '',
  yqm: ''
})

// 切换登录/注册模式
const toggleMode = () => {
  isLogin.value = !isLogin.value
}

// 发送验证码
const sendVerifyCode = async () => {
  if (!formData.email) {
    ElMessage.warning('请输入邮箱')
    return
  }

  // 如果倒计时中，不允许再次发送
  if (countdown.value > 0) return

  isLoading.value = true
  try {
    await sendCodeService({
      type: 'email',
      name: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword
    })
    // 成功后开始倒计时
    startCountdown()
  } catch (error) {
    // 错误已在拦截器中处理，这里不需要额外处理
    console.log('验证码处理完成')
  } finally {
    isLoading.value = false
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  clearInterval(timer)
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
    }
  }, 1000)
}

// 提交表单
const submitForm = async () => {
  if (!formData.email) {
    ElMessage.warning('请输入邮箱')
    return
  }
  if (!formData.password) {
    ElMessage.warning('请输入密码')
    return
  }
  
  if (!isLogin.value && formData.password !== formData.confirmPassword) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }
  
  if (!isLogin.value && !formData.code) {
    ElMessage.warning('请输入验证码')
    return
  }
  
  try {
    if (isLogin.value) {
      // 登录逻辑
      const res = await loginService({
        name: formData.email,
        password: formData.password,
        device: "d67e91813b07e8304ee0c974bc97238e"
      })
      
      // 保存用户数据到pinia
      console.log('登录成功，用户数据:', res.data)
      userStore.setInfo(res.data)
      
      ElMessage.success('登录成功')
      // 导航放在最后，避免组件卸载过早
      await router.push('/profile')
    } else {
      // 注册逻辑
      await registerService({
        name: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        code: formData.code,
        yqm: formData.yqm,
        type: "email",
        device: "d67e91813b07e8304ee0c974bc97238e"
      })
      
      // 清空表单，切换到登录页面
      formData.password = ''
      formData.confirmPassword = ''
      formData.code = ''
      isLogin.value = true
      
      ElMessage.success('注册成功，请登录')
    }
  } catch (error) {
    console.error('操作失败:', error)
  }
}

// 返回上一页
const goBack = () => {
  router.push('/profile')
}
</script>

<template>
  <div class="login-container">
    <!-- 返回按钮 -->
    <div class="back-button" @click="goBack">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 12H5"></path>
        <path d="M12 19l-7-7 7-7"></path>
      </svg>
    </div>

    <!-- 头像区域 -->
    <div class="avatar-container">
      <img :src="localLoginImg" alt="avatar" class="avatar-img"/>
    </div>

    <!-- 表单区域 -->
    <div class="form-container">
      <!-- 邮箱输入框 -->
      <div class="form-item">
        <div class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
        </div>
        <input
            type="email"
            v-model="formData.email"
            placeholder="邮箱"
            class="form-input"
        />
      </div>

      <!-- 密码输入框 -->
      <div class="form-item">
        <div class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <input
            :type="showPassword ? 'text' : 'password'"
            v-model="formData.password"
            placeholder="密码"
            class="form-input"
        />
        <div class="eye-icon" @click="showPassword = !showPassword">
          <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </div>
      </div>

      <!-- 忘记密码链接 (登录模式才显示) -->
      <div v-if="isLogin" class="text-right mb-3">
        <span class="forget-link">忘记密码?</span>
      </div>

      <!-- 确认密码输入框（注册时才显示） -->
      <div v-if="!isLogin" class="form-item">
        <div class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <input
            :type="showConfirmPassword ? 'text' : 'password'"
            v-model="formData.confirmPassword"
            placeholder="确认密码"
            class="form-input"
        />
        <div class="eye-icon" @click="showConfirmPassword = !showConfirmPassword">
          <svg v-if="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path
                d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        </div>
      </div>

      <!-- 验证码输入框（注册时才显示） -->
      <div v-if="!isLogin" class="form-item">
        <div class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
        </div>
        <input
            type="text"
            v-model="formData.code"
            placeholder="验证码"
            class="form-input"
        />
        <button
            @click="sendVerifyCode"
            class="verify-btn"
            :disabled="isLoading || countdown > 0"
            :class="{'loading': isLoading, 'counting': countdown > 0}"
        >
          <span v-if="countdown > 0">{{ countdown }}s</span>
          <span v-else-if="isLoading">发送中...</span>
          <span v-else>发送验证码</span>
        </button>
      </div>

      <!-- 邀请码输入框（注册时才显示） -->
      <div v-if="!isLogin" class="form-item">
        <div class="input-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 14l6-6"></path>
            <circle cx="9.5" cy="8.5" r="1.5"></circle>
            <circle cx="14.5" cy="13.5" r="1.5"></circle>
            <path d="M5 21l14-14"></path>
          </svg>
        </div>
        <input
            type="text"
            v-model="formData.yqm"
            placeholder="邀请码（可不填）"
            class="form-input"
        />
      </div>

      <!-- 登录/注册按钮 -->
      <button @click="submitForm" class="submit-button">
        {{ isLogin ? '登录' : '注册' }}
      </button>

      <!-- 切换登录/注册模式 -->
      <div class="text-center mt-4">
        <span class="toggle-mode" @click="toggleMode">
          {{ isLogin ? '还没有账号？立即注册' : '已有账号？立即登录' }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(to bottom, #ff5e62, #ff2957);
  padding: 20px;
  position: relative;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.back-button {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  cursor: pointer;
  z-index: 10;
}

.avatar-container {
  width: 100px;
  height: 100px;
  margin: 20px auto 40px;
  position: relative;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 5px;
}

.form-container {
  width: 100%;
  max-width: 350px;
  background-color: white;
  border-radius: 16px;
  padding: 30px 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.form-item {
  position: relative;
  margin-bottom: 15px;
}

.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
}

.form-input {
  width: 100%;
  padding: 12px 40px 12px 40px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  font-size: 14px;
  background-color: #F3F4F6;
}

.form-input:focus {
  outline: none;
  border-color: #ff2957;
  background-color: #f8f9fa;
}

.eye-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6B7280;
  cursor: pointer;
}

.verify-btn {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  background-color: #ff2957;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 80px;
  text-align: center;
}

.verify-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.verify-btn.loading {
  opacity: 0.7;
}

.verify-btn.counting {
  background-color: #888;
  cursor: not-allowed;
}

.submit-button {
  width: 100%;
  background-color: #ff2957;
  color: white;
  border: none;
  border-radius: 9999px; /* 完全圆角 */
  padding: 14px;
  font-size: 16px;
  font-weight: 600;
  margin-top: 20px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.submit-button:hover {
  background-color: #e51f48;
}

.forget-link {
  cursor: pointer;
  color: #6B7280;
  font-size: 14px;
}

.toggle-mode {
  cursor: pointer;
  color: #6B7280;
  font-size: 14px;
}

.text-right {
  text-align: right;
}

.mb-3 {
  margin-bottom: 12px;
}

.mt-4 {
  margin-top: 16px;
}

.text-center {
  text-align: center;
}
</style> 