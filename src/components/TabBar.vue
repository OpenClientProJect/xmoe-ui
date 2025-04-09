<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const tabs = [
  { 
    name: '首页', 
    icon: 'el-icon-home-filled', 
    activeIcon: 'el-icon-home-filled',
    path: '/' 
  },
  { 
    name: '榜单名单', 
    icon: 'el-icon-menu', 
    activeIcon: 'el-icon-menu',
    path: '/category' 
  },
  { 
    name: '订阅', 
    icon: 'el-icon-star', 
    activeIcon: 'el-icon-star-filled',
    path: '/subscription' 
  },
  { 
    name: '我的', 
    icon: 'el-icon-user', 
    activeIcon: 'el-icon-user-filled',
    path: '/profile' 
  }
]

const currentPath = computed(() => route.path)

const navigateTo = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="fixed bottom-0 left-0 w-full bg-white border-t z-10 flex">
    <div 
      v-for="tab in tabs" 
      :key="tab.name"
      class="flex-1 flex flex-col items-center justify-center py-2"
      :class="{'text-red-500': currentPath === tab.path, 'text-gray-500': currentPath !== tab.path}"
      @click="navigateTo(tab.path)"
    >
      <el-icon :size="22">
        <component :is="currentPath === tab.path ? tab.activeIcon : tab.icon" />
      </el-icon>
      <span class="text-xs mt-1">{{ tab.name }}</span>
    </div>
  </div>
</template>

<style scoped>
/* 添加样式如需要 */
</style> 