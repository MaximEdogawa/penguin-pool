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
    // Catch all route
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      redirect: '/',
    },
  ],
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  // Set page title
  document.title = `${to.meta.title} - Penguin-pool`

  // Get user store to check authentication status
  const userStore = useUserStore()
  const isAuthenticated = userStore.isAuthenticated

  // Check authentication requirements
  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      // User is authenticated, allow access
      next()
    } else {
      // User is not authenticated, redirect to auth page
      console.log('Route requires authentication, redirecting to login')
      next('/auth')
    }
  } else {
    // Route doesn't require auth
    if (to.path === '/auth' && isAuthenticated) {
      // User is already authenticated, redirect to dashboard
      console.log('User already authenticated, redirecting to dashboard')
      next('/dashboard')
    } else {
      // Allow access to non-auth routes
      next()
    }
  }
})

export default router
