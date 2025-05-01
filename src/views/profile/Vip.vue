<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import useUserInfoStore from '@/stores/userstores.js'
import { ArrowLeft, VideoPlay, Promotion, Medal } from "@element-plus/icons-vue"
import {rechargeService} from "@/api/vip.js";

const router = useRouter()
const userStore = useUserInfoStore()

// 用户信息
const userInfo = ref({
  email: '',
  isVip: false
})

// 会员套餐
const vipPackages = ref([
  {
    id: 1,
    name: '周卡',
    price: 70,
    duration: '7天',
    icon: '💳'
  },
  {
    id: 2,
    name: '月卡',
    price: 300,
    duration: '30天',
    icon: '💳'
  },
  {
    id: 3,
    name: '年卡',
    price: 3600,
    duration: '365天',
    icon: '💳'
  }
])

// 会员权益
const vipBenefits = ref([
  {
    id: 1,
    name: '看剧不限',
    icon: 'VideoPlay',
    description: '畅享全站视频内容'
  },
  {
    id: 2,
    name: '免广告',
    icon: 'Promotion',
    description: '观影无广告打扰'
  },
  {
    id: 3,
    name: '专属标识',
    icon: 'Medal',
    description: '尊贵身份标识'
  }
])

// 已选择的套餐
const selectedPackage = ref(null)

// 初始化用户信息
const initUserInfo = () => {
  // 检查用户是否登录
  if (!userStore.info || !userStore.info.user_id) {
    router.push('/login')
    return
  }
  
  userInfo.value = {
    email: userStore.info.user_email || userStore.info.user_name,
    isVip: false // 假设用户未开通会员
  }
}

// 开通会员
const activateVip = () => {
  // 获取选中的套餐
  if (!selectedPackage.value) {
    ElMessage.warning('请先选择会员套餐')
    return
  }
  
  payForVip(selectedPackage.value.id)
}

// 选择套餐
const selectPackage = (packageId) => {
  const pkg = vipPackages.value.find(p => p.id === packageId)
  if (pkg) {
    selectedPackage.value = pkg
  }
}

// 返回上一页
const goBack = () => {
  router.push("/profile")
}


// 会员充值
const payForVip = (packageId) => {
  if (!userStore.info || !userStore.info.user_id) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }
  
  let packageType = ''
  switch (packageId) {
    case 1:
      packageType = 'group_points_week' // 周卡
      break
    case 2:
      packageType = 'group_points_month' // 月卡
      break
    case 3:
      packageType = 'group_points_year' // 年卡
      break
    default:
      ElMessage.error('无效的套餐类型')
      return
  }
  
  // 调用充值接口
  rechargeService({
    user_id: userStore.info.user_id,
    type: packageType
  }).then(() => {
      ElMessage.success('会员充值成功')
      setTimeout(() => {
        router.go(0) // 刷新页面
      }, 1500)
  })
}

// 组件挂载时初始化
onMounted(() => {
  initUserInfo()
})
</script>

<template>
  <div class="vip-container">
    <!-- 头部导航栏 -->
    <div class="header">
      <div class="header-left" @click="goBack">
        <el-icon size="20">
          <ArrowLeft />
        </el-icon>
      </div>
      <div class="header-title">会员中心</div>
      <div class="header-right"></div>
    </div>
    
    <!-- 用户信息卡片 -->
    <div class="user-card">
      <div class="avatar-container">
        <div class="diamond-avatar">
          <div class="diamond-inner">V</div>
        </div>
      </div>
      
      <div class="user-info">
        <div class="user-email">{{ userInfo.email }}</div>
        <div class="user-vip-status">开通会员，享受尊贵特权</div>
      </div>
    </div>
    
    <!-- 会员权益 -->
    <div class="vip-section">
      <h3 class="section-title">会员权益</h3>
      <div class="benefits-container">
        <div 
          v-for="benefit in vipBenefits" 
          :key="benefit.id"
          class="benefit-item"
        >
          <div class="benefit-icon">
            <el-icon size="24">
              <component :is="benefit.icon"/>
            </el-icon>
          </div>
          <div class="benefit-name">{{ benefit.name }}</div>
        </div>
      </div>
    </div>
    
    <!-- 会员服务 -->
    <div class="vip-section">
      <h3 class="section-title">会员服务</h3>
      <div class="packages-container">
        <div 
          v-for="pkg in vipPackages" 
          :key="pkg.id"
          class="package-item"
          :class="{'package-selected': selectedPackage && selectedPackage.id === pkg.id}"
          @click="selectPackage(pkg.id)"
        >
          <div class="package-icon">{{ pkg.icon }}</div>
          <div class="package-price">{{ pkg.price }}</div>
          <div class="package-name">{{ pkg.name }}</div>
        </div>
      </div>
    </div>
    
    <!-- 开通会员按钮 -->
    <div class="activate-button-container">
      <button class="activate-button" @click="activateVip">
        开通会员
      </button>
    </div>
    
  </div>
</template>

<style scoped>
.vip-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 60px;
}

/* 头部导航栏 */
.header {
  height: 56px;
  background-color: #8e44ad; /* 紫色主题 */
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
}

.header-right {
  width: 40px;
}

/* 用户信息卡片 */
.user-card {
  margin: 16px;
  background-color: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.avatar-container {
  margin-right: 16px;
}

.diamond-avatar {
  width: 60px;
  height: 60px;
  background-color: #f0f0f0;
  transform: rotate(45deg);
  position: relative;
  overflow: hidden;
}

.diamond-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transform: rotate(-45deg);
  font-size: 24px;
  font-weight: bold;
  color: #8e44ad;
}

.user-info {
  flex: 1;
}

.user-email {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 8px;
}

.user-vip-status {
  font-size: 14px;
  color: #8e44ad;
}

/* 会员权益和服务 */
.vip-section {
  margin: 24px 16px 16px 16px;
  background-color: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  margin: 0 0 16px 0;
  color: #333;
}

/* 会员权益列表 */
.benefits-container {
  display: flex;
  justify-content: space-around;
}

.benefit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 33.33%;
}

.benefit-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #f2e6f7;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 8px;
  color: #8e44ad;
}

.benefit-name {
  font-size: 14px;
  color: #333;
}

/* 会员套餐 */
.packages-container {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.package-item {
  flex: 1;
  background-color: #f9f9f9;
  border-radius: 12px;
  padding: 16px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
  border: 2px solid transparent;
}

.package-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.package-selected {
  border-color: #8e44ad;
  background-color: rgba(142, 68, 173, 0.05);
}

.package-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.package-price {
  font-size: 18px;
  font-weight: 600;
  color: #8e44ad;
  margin-bottom: 4px;
}

.package-name {
  font-size: 14px;
  color: #555;
}

/* 开通按钮 */
.activate-button-container {
  margin: 24px 16px;
}

.activate-button {
  width: 100%;
  height: 48px;
  background-color: #8e44ad;
  color: white;
  border: none;
  border-radius: 24px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.activate-button:hover {
  background-color: #7d3c98;
}

/* 底部提示 */
.footer-tips {
  text-align: center;
  color: #8e44ad;
  font-size: 14px;
  padding: 8px 16px;
  text-decoration: underline;
  cursor: pointer;
}
</style> 