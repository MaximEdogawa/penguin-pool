import { useUserStore } from '@/entities/user/store/userStore'
import {
  defaultFeatureFlags,
  getCurrentEnvironment,
  isFeatureEnabled,
} from '@/shared/config/featureFlags'
import '@/types/router'
import { createRouter, createWebHistory } from 'vue-router'

// Create static routes that will be filtered by the router guard
const routes = [
  {
    path: '/',
    redirect: '/dashboard',
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
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/pages/Dashboard/DashboardPage.vue'),
    meta: {
      title: 'Dashboard',
      requiresAuth: true,
      featureFlag: 'dashboard',
    },
  },
  {
    path: '/offers',
    name: 'offers',
    component: () => import('@/pages/Offers/OffersPage.vue'),
    meta: {
      title: 'Offers',
      requiresAuth: true,
      featureFlag: 'offers',
    },
  },
  {
    path: '/loans',
    name: 'loans',
    component: () => import('@/pages/Loans/LoansPage.vue'),
    meta: {
      title: 'Loans',
      requiresAuth: true,
      featureFlag: 'loans',
    },
  },
  {
    path: '/option-contracts',
    name: 'option-contracts',
    component: () => import('@/pages/OptionContracts/OptionContractsPage.vue'),
    meta: {
      title: 'Option Contracts',
      requiresAuth: true,
      featureFlag: 'optionContracts',
    },
  },
  {
    path: '/piggy-bank',
    name: 'piggy-bank',
    component: () => import('@/pages/PiggyBank/PiggyBankPage.vue'),
    meta: {
      title: 'Piggy Bank',
      requiresAuth: true,
      featureFlag: 'piggyBank',
    },
  },
  {
    path: '/wallet',
    name: 'wallet',
    component: () => import('@/pages/Wallet/WalletPage.vue'),
    meta: {
      title: 'Wallet',
      requiresAuth: true,
      featureFlag: 'wallet',
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/pages/Profile/ProfilePage.vue'),
    meta: {
      title: 'Profile',
      requiresAuth: true,
      featureFlag: 'profile',
    },
  },
  {
    path: '/service-health',
    name: 'service-health',
    component: () => import('@/pages/ServiceHealth/ServiceHealthPage.vue'),
    meta: {
      title: 'Service Health',
      requiresAuth: true,
      featureFlag: 'serviceHealth',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} - Penguin-pool`

  const userStore = useUserStore()
  const isAuthenticated = userStore.isAuthenticated

  // Check if route requires a feature flag
  if (to.meta.featureFlag) {
    const currentEnv = getCurrentEnvironment()

    // Get the feature flag for the specific feature
    const featureKey = to.meta.featureFlag as keyof typeof defaultFeatureFlags.app
    const feature = defaultFeatureFlags.app[featureKey]

    if (feature && !isFeatureEnabled(feature, currentEnv, to.meta.featureFlag as string)) {
      console.log(
        `Router guard - feature ${to.meta.featureFlag} is disabled, redirecting to dashboard`
      )
      next('/dashboard')
      return
    }
  }

  if (to.meta.requiresAuth) {
    // Check both authentication and wallet connection for protected routes
    if (isAuthenticated) {
      next()
    } else {
      console.log('Router guard - redirecting to auth (not authenticated or wallet not connected)')
      next('/auth')
    }
  } else {
    if (to.path === '/auth' && isAuthenticated) {
      console.log(
        'Router guard - redirecting authenticated user with wallet from auth to dashboard'
      )
      next('/dashboard')
    } else {
      console.log('Router guard - allowing access to public route')
      next()
    }
  }
})

export default router
