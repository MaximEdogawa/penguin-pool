// Extend Vue Router types
declare module 'vue-router' {
  interface RouteMeta {
    title: string
    requiresAuth: boolean
    featureFlag?: string
  }
}
