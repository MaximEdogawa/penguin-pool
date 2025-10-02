import { useUserStore } from '@/entities/user/store/userStore'
import LoginPage from '@/pages/Auth/LoginPage.vue'
import DashboardPage from '@/pages/Dashboard/DashboardPage.vue'
import LoansPage from '@/pages/Loans/LoansPage.vue'
import OffersPage from '@/pages/Offers/OffersPage.vue'
import OptionContractsPage from '@/pages/OptionContracts/OptionContractsPage.vue'
import PiggyBankPage from '@/pages/PiggyBank/PiggyBankPage.vue'
import ProfilePage from '@/pages/Profile/ProfilePage.vue'
import ServiceHealthPage from '@/pages/ServiceHealth/ServiceHealthPage.vue'
import WalletPage from '@/pages/Wallet/WalletPage.vue'
import {
  defaultFeatureFlags,
  getCurrentEnvironment,
  isFeatureEnabled,
} from '@/shared/config/featureFlags'
import '@/types/router'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
  },
  {
    path: '/auth',
    name: 'auth',
    component: LoginPage,
    meta: {
      title: 'Authentication',
      requiresAuth: false,
    },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardPage,
    meta: {
      title: 'Dashboard',
      requiresAuth: true,
      featureFlag: 'dashboard',
    },
  },
  {
    path: '/offers',
    name: 'offers',
    component: OffersPage,
    meta: {
      title: 'Offers',
      requiresAuth: true,
      featureFlag: 'offers',
    },
  },
  {
    path: '/loans',
    name: 'loans',
    component: LoansPage,
    meta: {
      title: 'Loans',
      requiresAuth: true,
      featureFlag: 'loans',
    },
  },
  {
    path: '/option-contracts',
    name: 'option-contracts',
    component: OptionContractsPage,
    meta: {
      title: 'Option Contracts',
      requiresAuth: true,
      featureFlag: 'optionContracts',
    },
  },
  {
    path: '/piggy-bank',
    name: 'piggy-bank',
    component: PiggyBankPage,
    meta: {
      title: 'Piggy Bank',
      requiresAuth: true,
      featureFlag: 'piggyBank',
    },
  },
  {
    path: '/wallet',
    name: 'wallet',
    component: WalletPage,
    meta: {
      title: 'Wallet',
      requiresAuth: true,
      featureFlag: 'wallet',
    },
  },
  {
    path: '/profile',
    name: 'profile',
    component: ProfilePage,
    meta: {
      title: 'Profile',
      requiresAuth: true,
      featureFlag: 'profile',
    },
  },
  {
    path: '/service-health',
    name: 'service-health',
    component: ServiceHealthPage,
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
  const { isAuthenticated } = userStore

  if (to.meta.featureFlag) {
    const currentEnv = getCurrentEnvironment()
    const featureKey = to.meta.featureFlag as keyof typeof defaultFeatureFlags.app
    const feature = defaultFeatureFlags.app[featureKey]

    if (feature && !isFeatureEnabled(feature, currentEnv, to.meta.featureFlag as string)) {
      // Feature disabled, redirecting to dashboard
      next('/dashboard')
      return
    }
  }

  if (to.meta.requiresAuth) {
    if (isAuthenticated) {
      // User authenticated, allowing access to protected route
      next()
    } else {
      // Redirecting to auth (not authenticated)
      next('/auth')
    }
  } else {
    if (to.path === '/auth' && isAuthenticated) {
      // Redirecting authenticated user from auth to dashboard
      next('/dashboard')
    } else {
      // Allowing access to public route
      next()
    }
  }
})

export default router
