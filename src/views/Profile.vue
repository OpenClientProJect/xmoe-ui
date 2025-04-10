<script setup>
import { ref } from 'vue'

// 用户信息
const userInfo = {
  username: '小萌新',
  avatar: 'https://avatars.githubusercontent.com/u/156616301?v=4',
  level: 5,
  vipLevel: 1,
  coins: 120
}

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
</script>

<template>
  <div class="profile-container pb-16">
    <!-- 个人信息 -->
    <div class="bg-gradient-to-r from-red-400 to-red-500 text-white p-4">
      <div class="flex items-center">
        <div class="relative">
          <img :src="userInfo.avatar" class="w-16 h-16 rounded-full border-2 border-white" alt="avatar" />
          <div class="absolute -bottom-1 -right-1 bg-yellow-400 text-xs text-black font-medium px-1 rounded-full">
            Lv.{{ userInfo.level }}
          </div>
        </div>
        
        <div class="ml-3">
          <div class="flex items-center">
            <h2 class="text-lg font-medium">{{ userInfo.username }}</h2>
            <div class="ml-2 px-2 py-0.5 bg-yellow-500 text-xs rounded-full text-black flex items-center">
              <el-icon class="mr-0.5"><el-icon-crown /></el-icon>
              <span>会员{{ userInfo.vipLevel }}</span>
            </div>
          </div>
          
          <div class="mt-1 text-sm opacity-90">XMoe ID: 8901234</div>
          
          <div class="mt-2 flex items-center">
            <div class="px-2 py-1 bg-white/20 rounded-full flex items-center mr-2">
              <el-icon class="mr-1"><el-icon-coin /></el-icon>
              <span class="text-xs">{{ userInfo.coins }}</span>
            </div>
            <div class="px-2 py-1 bg-white/20 rounded-full text-xs">
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
      <el-button class="w-full" plain>退出登录</el-button>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style> 