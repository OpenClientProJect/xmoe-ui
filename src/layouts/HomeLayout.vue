<script setup>
import { ref, onMounted } from 'vue'
import HeaderNav from "@/views/home/common/HeaderNav.vue";
import TabBar from "@/components/TabBar.vue";

// 当前激活的标签
const activeTab = ref('推荐')

// 处理标签切换事件
const handleTabChange = (tab) => {
  activeTab.value = tab
}
</script>

<template>
  <div class="home-layout">
    <!-- 顶部导航容器 - 使用fixed定位 -->
    <div class="page-header">
      <!-- 顶部搜索栏和导航栏 -->
      <HeaderNav
        :active-tab="activeTab"
        @tab-change="handleTabChange"
      />
    </div>

    <!-- 内容区域 - 添加足够的上边距避免被顶部遮挡 -->
    <div class="page-content">
      <!-- 路由视图，用于显示子路由内容 -->
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" @tab-change="handleTabChange" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<style scoped>
.home-layout {
  min-height: 100vh;
  background-color: #ffffff;
  display: flex;
  flex-direction: column;
}

.page-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
}

.page-content {
  flex: 1;
  padding-top: 100px; /* 为顶部导航栏留出空间 */
}

/* 适配有子菜单的情况 */
:deep(.sub-menu-container) ~ .page-content {
  padding-top: 140px; /* 为顶部导航栏和子菜单留出空间 */
}
</style>