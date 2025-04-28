import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import {createPersistedState} from "pinia-persistedstate-plugin";
import {createPinia} from "pinia";
import './assets/main.css'

const app = createApp(App)
const persist = createPersistedState()
const pinia =  createPinia()

// 注册所有Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
pinia.use(persist)
app.use(router)
app.use(ElementPlus)
app.use(pinia)
app.mount('#app')
