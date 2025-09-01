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

  // Development mode: Skip authentication for now
  if (import.meta.env.DEV) {
    // Create mock user for development
    if (!localStorage.getItem('penguin-pool-user')) {
      const mockUser = {
        id: 'dev-user-1',
        username: 'Developer',
        walletAddress: 'xch1dev123456789',
        balance: 1000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        preferences: {
          theme: 'auto',
          language: 'en',
          currency: 'XCH',
          notifications: { email: false, push: true, sms: false },
          privacy: { shareAnalytics: false, shareUsageData: false },
        },
      }
      localStorage.setItem('penguin-pool-user', JSON.stringify(mockUser))
    }
    next()
    return
  }

  // Check if user is authenticated
  const isAuthenticated = localStorage.getItem('penguin-pool-user') !== null

  // Check authentication requirements
  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      // User is authenticated, allow access
      next()
    } else {
      // User is not authenticated, redirect to auth page
      next('/auth')
    }
  } else {
    // Route doesn't require auth
    if (to.path === '/auth' && isAuthenticated) {
      // User is already authenticated, redirect to dashboard
      next('/')
    } else {
      // Allow access to non-auth routes
      next()
    }
  }
})

export default router
