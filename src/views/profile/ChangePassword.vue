<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import useUserInfoStore from '@/stores/userstores.js'
import { ArrowLeft, Loading } from "@element-plus/icons-vue"
import {updatePasswordService} from "@/api/user.js";

const router = useRouter()
const userStore = useUserInfoStore()

// 表单数据
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单验证规则
const formRules = {
  oldPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少为6个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 表单引用
const formRef = ref(null)

// 加载状态
const loading = ref(false)

// 检查用户登录状态
const checkLoginStatus = () => {
  if (!userStore.info || !userStore.info.user_id) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return false
  }
  return true
}

// 提交修改密码
const submitForm = async () => {
  if (!checkLoginStatus()) return
  
  if (!formRef.value) return
  
  try {
    // 表单验证
    await formRef.value.validate()
    
    loading.value = true
    
    await updatePasswordService({
      user_id: userStore.info.user_id,
      user_old_pwd: passwordForm.value.oldPassword,
      user_new_pwd: passwordForm.value.newPassword,
      user_confirm_new_pwd: passwordForm.value.confirmPassword
    })
    ElMessage.success('密码修改成功')
    
    // 重置表单
    passwordForm.value = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  router.push('/profile')
}

// 组件挂载时检查登录状态
onMounted(() => {
  checkLoginStatus()
})
</script>

<template>
  <div class="change-password-container">
    <!-- 头部导航栏 -->
    <div class="header">
      <div class="header-left" @click="goBack">
        <el-icon size="20">
          <ArrowLeft />
        </el-icon>
      </div>
      <div class="header-title">修改密码</div>
      <div class="header-right"></div>
    </div>

    <!-- 密码修改表单 -->
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="passwordForm"
        :rules="formRules"
        label-position="top"
        class="password-form"
      >
        <el-form-item label="当前密码" prop="oldPassword">
          <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        
        <div class="form-tips">
          <p>密码长度至少6位，建议使用字母、数字和符号的组合</p>
          <p>为了保证账号安全，修改密码后需要重新登录</p>
        </div>
        
        <div class="form-buttons">
          <el-button
            type="primary"
            @click="submitForm"
            :loading="loading"
          >
            {{ loading ? '提交中...' : '确认修改' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.change-password-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60px;
}

/* 头部导航栏 */
.header {
  height: 56px;
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  text-align: center;
  flex: 1;
}

.header-right {
  width: 40px;
}

/* 表单区域 */
.form-container {
  margin: 20px 16px;
  background-color: white;
  border-radius: 12px;
  padding: 24px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.password-form {
  max-width: 500px;
  margin: 0 auto;
}

.form-tips {
  margin: 16px 0;
  padding: 12px;
  background-color: #f0f9ff;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  line-height: 1.5;
}

.form-tips p {
  margin: 6px 0;
}

.form-buttons {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  gap: 12px;
}

/* 响应式调整 */
@media (max-width: 480px) {
  .form-container {
    padding: 16px 12px;
  }
  
  .form-buttons {
    flex-direction: column-reverse;
    gap: 8px;
  }
  
  .form-buttons .el-button {
    width: 100%;
  }
}
</style> 