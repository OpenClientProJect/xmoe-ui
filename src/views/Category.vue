<script setup>
import { ref } from 'vue'

// 模拟分类数据
const categories = [
  {
    id: 1,
    name: '热门番剧',
    cover: 'https://placeholder.pics/svg/160x90/FF9CAA/FFFFFF/热门番剧'
  },
  {
    id: 2,
    name: '国创动漫',
    cover: 'https://placeholder.pics/svg/160x90/AAFFCE/555555/国创动漫'
  },
  {
    id: 3,
    name: '经典动画',
    cover: 'https://placeholder.pics/svg/160x90/CEAAFF/FFFFFF/经典动画'
  },
  {
    id: 4,
    name: '冒险',
    cover: 'https://placeholder.pics/svg/160x90/AACEEF/FFFFFF/冒险'
  },
  {
    id: 5,
    name: '战斗',
    cover: 'https://placeholder.pics/svg/160x90/FFCEAA/555555/战斗'
  },
  {
    id: 6,
    name: '科幻',
    cover: 'https://placeholder.pics/svg/160x90/AAFFAA/555555/科幻'
  },
  {
    id: 7,
    name: '魔法',
    cover: 'https://placeholder.pics/svg/160x90/FFAAAA/FFFFFF/魔法'
  },
  {
    id: 8,
    name: '校园',
    cover: 'https://placeholder.pics/svg/160x90/AAAAFF/FFFFFF/校园'
  }
]

// 模拟排行榜数据
const rankingLists = [
  {
    id: 1,
    name: '热播榜',
    animes: [
      { id: 101, title: '咒术回战 第二季', rank: 1 },
      { id: 102, title: '间谍过家家 第二季', rank: 2 },
      { id: 103, title: '葬送的芙莉莲', rank: 3 },
      { id: 104, title: '海贼王', rank: 4 },
      { id: 105, title: '名侦探柯南', rank: 5 }
    ]
  },
  {
    id: 2,
    name: '新番榜',
    animes: [
      { id: 201, title: '久保同学不放过我', rank: 1 },
      { id: 202, title: '快藏起来！玛琪娜同学', rank: 2 },
      { id: 203, title: '间谍教室 第二季', rank: 3 },
      { id: 204, title: '道动乱世', rank: 4 },
      { id: 205, title: '东京复仇者 第三季', rank: 5 }
    ]
  }
]
</script>

<template>
  <div class="category-container pb-16">
    <!-- 顶部标题栏 -->
    <div class="sticky top-0 bg-white z-10 px-4 py-3 border-b">
      <h1 class="text-lg font-medium text-center">榜单分类</h1>
    </div>
    
    <!-- 分类列表 -->
    <div class="p-4">
      <h2 class="text-base font-medium mb-3">热门分类</h2>
      <div class="grid grid-cols-4 gap-3">
        <div v-for="category in categories" :key="category.id" class="flex flex-col items-center">
          <div class="relative w-full aspect-video rounded-lg overflow-hidden mb-1">
            <img :src="category.cover" class="w-full h-full object-cover" />
          </div>
          <span class="text-xs">{{ category.name }}</span>
        </div>
      </div>
    </div>
    
    <!-- 排行榜 -->
    <div class="p-4">
      <h2 class="text-base font-medium mb-3">推荐榜单</h2>
      
      <div v-for="list in rankingLists" :key="list.id" class="mb-5">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-medium">{{ list.name }}</h3>
          <span class="text-xs text-gray-500">更多 &gt;</span>
        </div>
        
        <div class="bg-white rounded-lg p-3">
          <div 
            v-for="anime in list.animes" 
            :key="anime.id" 
            class="flex items-center py-2 border-b last:border-b-0"
          >
            <span 
              class="w-5 h-5 rounded-full flex items-center justify-center mr-3 text-xs"
              :class="{
                'bg-red-500 text-white': anime.rank === 1,
                'bg-orange-400 text-white': anime.rank === 2,
                'bg-yellow-400 text-white': anime.rank === 3,
                'bg-gray-200 text-gray-600': anime.rank > 3
              }"
            >
              {{ anime.rank }}
            </span>
            <span class="text-sm">{{ anime.title }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style> 