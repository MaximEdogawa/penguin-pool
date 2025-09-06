import { useUserStore } from '@/entities/user/store/userStore'
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/pages/Dashboard/DashboardPage.vue'),
      meta: {
        title: 'Dashboard',
        requiresAuth: true,
      },
    },
    {
      path: '/option-contracts',
      name: 'option-contracts',
      component: () => import('@/pages/OptionContracts/OptionContractsPage.vue'),
      meta: {
        title: 'Option Contracts',
        requiresAuth: true,
      },
    },
    {
      path: '/loans',
      name: 'loans',
      component: () => import('@/pages/Loans/LoansPage.vue'),
      meta: {
        title: 'Loans',
        requiresAuth: true,
      },
    },
    {
      path: '/offers',
      name: 'offers',
      component: () => import('@/pages/Offers/OffersPage.vue'),
      meta: {
        title: 'Offers',
        requiresAuth: true,
      },
    },
    {
      path: '/piggy-bank',
      name: 'piggy-bank',
      component: () => import('@/pages/PiggyBank/PiggyBankPage.vue'),
      meta: {
        title: 'Piggy Bank',
        requiresAuth: true,
      },
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('@/pages/Profile/ProfilePage.vue'),
      meta: {
        title: 'Profile',
        requiresAuth: true,
      },
    },
    {
      path: '/service-health',
      name: 'service-health',
      component: () => import('@/pages/ServiceHealth/ServiceHealthPage.vue'),
      meta: {
        title: 'Service Health',
        requiresAuth: true,
      },
    },

    {
      path: '/auth',
      name: 'auth',
      component: () => import('@/pages/Auth/LoginPage.vue'),
      meta: {
        title: 'Authentication',
        requiresAuth: false,
      },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/',
    },
  ],
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - Penguin-pool`

  const userStore = useUserStore()
  const isAuthenticated = userStore.isAuthenticated

  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      console.log('Router guard - allowing access to protected route')
      next()
    } else {
      console.log('Router guard - redirecting to auth (not authenticated)')
      next('/auth')
    }
  } else {
    if (to.path === '/auth' && isAuthenticated) {
      console.log('Router guard - redirecting authenticated user from auth to dashboard')
      next('/dashboard')
    } else {
      console.log('Router guard - allowing access to public route')
      next()
    }
  }
})

export default router
