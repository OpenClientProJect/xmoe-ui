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
        component: () => import('../components/home/DramaList.vue'),
        meta: { showTabBar: true }
      },
      {
        path: 'movie',
        name: 'Movie',
        component: () => import('../components/home/Movie.vue'),
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
    component: () => import('../views/UserSettings.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/video/:id',
    name: 'VideoDetail',
    component: () => import('../components/home/VideoDetail.vue'),
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
    component: () => import('../views/Login.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/history/:userId',
    name: 'UserHistory',
    component: () => import('../views/UserHistory.vue'),
    meta: { showTabBar: true }
  },
  {
    path: '/points',
    name: 'Points',
    component: () => import('../views/Points.vue'),
    meta: { showTabBar: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router