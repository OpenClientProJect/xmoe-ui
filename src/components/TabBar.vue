<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
// 导入本地SVG图标
import homeIcon from '@/assets/icon/home.svg'
import userIcon from '@/assets/icon/user.svg'

const router = useRouter()
const route = useRoute()

const tabs = [
  { 
    name: '首页', 
    icon: homeIcon, 
    path: '/' 
  },
  {
    name: '我的', 
    icon: userIcon, 
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
      <img :src="tab.icon" class="icon-img" alt="tab-icon" />
      <span class="text-xs mt-1">{{ tab.name }}</span>
    </div>
  </div>
</template>

<style scoped>
/* 图标样式 */
.icon-img {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}

/* 活跃状态的图标可以添加滤镜效果，使其呈现主题色 */
.text-red-500 .icon-img {
  filter: invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%);
}

/* 非活跃状态的图标样式 */
.text-gray-500 .icon-img {
  filter: invert(46%) sepia(9%) saturate(373%) hue-rotate(182deg) brightness(94%) contrast(90%);
}
</style> 