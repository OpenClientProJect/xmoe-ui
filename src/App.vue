<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'

const route = useRoute()
const showTabBar = computed(() => {
  return route.meta.showTabBar !== false
})
</script>

<template>
  <div class="app-container">
    <div class="app-content" :class="{ 'has-tab-bar': showTabBar }">
      <router-view />
    </div>
    <TabBar v-if="showTabBar" />
  </div>
</template>

<style>
html, body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

.app-container {
  position: relative;
}

.app-content {
  min-height: 100vh;
}

.has-tab-bar {
  padding-bottom: 50px;
}

/* iOS 底部安全区域适配 */
@supports (padding: max(0px)) {
  .has-tab-bar {
    padding-bottom: calc(50px + env(safe-area-inset-bottom, 0px));
  }
}
</style>
