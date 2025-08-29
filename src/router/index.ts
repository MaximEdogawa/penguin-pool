import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/pages/Dashboard/DashboardPage.vue'),
      meta: {
        title: 'Dashboard',
        requiresAuth: false,
      },
    },
    {
      path: '/option-contracts',
      name: 'option-contracts',
      component: () => import('@/pages/OptionContracts/OptionContractsPage.vue'),
      meta: {
        title: 'Option Contracts',
        requiresAuth: false,
      },
    },
    {
      path: '/loans',
      name: 'loans',
      component: () => import('@/pages/Loans/LoansPage.vue'),
      meta: {
        title: 'Loans',
        requiresAuth: false,
      },
    },
    {
      path: '/offers',
      name: 'offers',
      component: () => import('@/pages/Offers/OffersPage.vue'),
      meta: {
        title: 'Offers',
        requiresAuth: false,
      },
    },
    {
      path: '/piggy-bank',
      name: 'piggy-bank',
      component: () => import('@/pages/PiggyBank/PiggyBankPage.vue'),
      meta: {
        title: 'Piggy Bank',
        requiresAuth: false,
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
      component: () => import('@/pages/Dashboard/DashboardPage.vue'),
      meta: {
        title: 'Dashboard',
        requiresAuth: false,
      },
    },
  ],
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  // Set page title
  document.title = `${to.meta.title} - Penguin-pool`

  // Check authentication requirements
  if (to.meta.requiresAuth) {
    // TODO: Implement proper authentication check
    // For now, allow all routes
    next()
  } else {
    next()
  }
})

export default router
