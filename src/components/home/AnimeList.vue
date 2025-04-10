<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const props = defineProps({
  animeList: {
    type: Array,
    default: () => []
  }
})

// 筛选分类
const animeFilters = [
  { name: '最新', active: true },
  { name: '类型', active: false },
  { name: '地区', active: false },
  { name: '语言', active: false },
  { name: '年份', active: false }
]

const activeFilter = ref('最新')

// 切换筛选分类
const changeFilter = (filter) => {
  activeFilter.value = filter
}

// 跳转到详情页
const goToAnimeDetail = (id) => {
  router.push(`/video-detail?id=${id}`)
}
</script>

<template>
  <div class="anime-content">
    <!-- 筛选条件 -->
    <div class="filter-container">
      <div 
        v-for="filter in animeFilters" 
        :key="filter.name"
        class="filter-item"
        :class="{'filter-active': activeFilter === filter.name}"
        @click="changeFilter(filter.name)"
      >
        {{ filter.name }}
        <span v-if="filter.name !== '最新'" class="filter-arrow">▼</span>
      </div>
    </div>

    <!-- 番剧列表 -->
    <div class="anime-list">
      <div 
        v-for="anime in animeList" 
        :key="anime.id"
        class="anime-card"
        @click="goToAnimeDetail(anime.id)"
      >
        <div class="anime-cover">
          <img :src="anime.cover" alt="anime cover" class="anime-img" />
          <span class="anime-episodes">{{ anime.episodes }}</span>
        </div>
        <div class="anime-title">{{ anime.title }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 番剧内容区域 */
.anime-content {
  padding: 0 0 80px;
}

/* 筛选条件 */
.filter-container {
  display: flex;
  overflow-x: auto;
  background: #fff;
  padding: 10px 15px;
  margin-bottom: 10px;
  scrollbar-width: none;
}

.filter-container::-webkit-scrollbar {
  display: none;
}

.filter-item {
  padding: 5px 12px;
  margin-right: 15px;
  font-size: 14px;
  color: #666;
  white-space: nowrap;
  display: flex;
  align-items: center;
}

.filter-arrow {
  font-size: 10px;
  margin-left: 4px;
}

.filter-active {
  color: #dc2626;
  font-weight: 500;
}

/* 番剧列表 */
.anime-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 0 12px;
}

.anime-card {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

.anime-cover {
  position: relative;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 3/4;
}

.anime-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.anime-episodes {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
  color: white;
  padding: 5px;
  font-size: 10px;
  text-align: center;
}

.anime-title {
  font-size: 12px;
  margin-top: 6px;
  text-align: center;
  line-height: 1.3;
  height: 2.6em;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style> 