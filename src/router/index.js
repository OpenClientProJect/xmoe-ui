import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/category',
    name: 'Category',
    component: () => import('../views/Category.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/subscription',
    name: 'Subscription',
    component: () => import('../views/Subscription.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/video/:id',
    name: 'VideoDetail',
    component: () => import('../views/VideoDetail.vue'),
    meta: { showTabBar: false }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue'),
    meta: { showTabBar: false }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 