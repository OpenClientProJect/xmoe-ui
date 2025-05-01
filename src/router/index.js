import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/HomeLayout.vue'),
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('../views/Home.vue'),
        meta: { showTabBar: true }
      },
      {
        path: 'anime',
        name: 'Anime',
        component: () => import('../views/home/DramaList.vue'),
        meta: { showTabBar: true }
      },
      {
        path: 'movie',
        name: 'Movie',
        component: () => import('../views/home/Movie.vue'),
        meta: { showTabBar: true }
      },
      {
        path: '4k',
        name: '4K',
        component: () => import('../views/Home.vue'),
        meta: { showTabBar: true }
      }
    ]
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/settings/profile',
    name: 'UserSettings',
    component: () => import('../views/profile/UserSettings.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/video/:id',
    name: 'VideoDetail',
    component: () => import('../views/home/VideoDetail.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/profile/Login.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/history/:userId',
    name: 'UserHistory',
    component: () => import('../views/profile/UserHistory.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/points',
    name: 'Points',
    component: () => import('../views/profile/Points.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/vip',
    name: 'VIP',
    component: () => import('../views/profile/Vip.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/settings/messages',
    name: 'Messages',
    component: () => import('../views/profile/Messages.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/feedback',
    name: 'Feedback',
    component: () => import('../views/profile/Feedback.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/settings/password',
    name: 'ChangePassword',
    component: () => import('../views/profile/ChangePassword.vue'),
    meta: { showTabBar: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router