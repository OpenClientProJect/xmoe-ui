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
    <router-view />
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
  min-height: 100vh;
  position: relative;
}
</style>
