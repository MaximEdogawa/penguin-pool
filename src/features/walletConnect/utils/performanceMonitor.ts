/**
 * Performance Monitor for AppKit
 *
 * This utility monitors AppKit loading and connection performance
 * to help optimize the user experience.
 */

interface PerformanceMetrics {
  appKitLoadTime: number
  connectionTime: number
  totalTime: number
  bundleSize: number
  memoryUsage: number
  timestamp: number
}

interface PerformanceEntry {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class PerformanceMonitor {
  private entries: Map<string, PerformanceEntry> = new Map()
  private metrics: PerformanceMetrics[] = []
  private maxMetrics = 100 // Keep only last 100 metrics

  public startTiming(name: string): void {
    this.entries.set(name, {
      name,
      startTime: performance.now(),
    })
  }

  public endTiming(name: string): number | null {
    const entry = this.entries.get(name)
    if (!entry) {
      console.warn(`Performance entry "${name}" not found`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - entry.startTime

    entry.endTime = endTime
    entry.duration = duration

    console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`)
    return duration
  }

  public measureAppKitLoad(): void {
    this.startTiming('appkit-load')
  }

  public endAppKitLoad(): number | null {
    return this.endTiming('appkit-load')
  }

  public measureConnection(): void {
    this.startTiming('wallet-connection')
  }

  public endConnection(): number | null {
    return this.endTiming('wallet-connection')
  }

  public recordMetrics(appKitLoadTime: number, connectionTime: number): void {
    const totalTime = appKitLoadTime + connectionTime
    const bundleSize = this.estimateBundleSize()
    const memoryUsage = this.getMemoryUsage()

    const metric: PerformanceMetrics = {
      appKitLoadTime,
      connectionTime,
      totalTime,
      bundleSize,
      memoryUsage,
      timestamp: Date.now(),
    }

    this.metrics.push(metric)

    // Keep only the last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    console.log('📊 Performance Metrics:', {
      appKitLoad: `${appKitLoadTime.toFixed(2)}ms`,
      connection: `${connectionTime.toFixed(2)}ms`,
      total: `${totalTime.toFixed(2)}ms`,
      bundleSize: `${(bundleSize / 1024).toFixed(2)}KB`,
      memory: `${(memoryUsage / 1024 / 1024).toFixed(2)}MB`,
    })
  }

  private estimateBundleSize(): number {
    // Estimate bundle size based on loaded modules
    let size = 0

    // Check if WalletConnect modules are loaded
    if (this.isModuleLoaded('@walletconnect/modal')) size += 0.3 * 1024 * 1024 // 0.3MB
    if (this.isModuleLoaded('@walletconnect/sign-client')) size += 0.2 * 1024 * 1024 // 0.2MB

    return size
  }

  private isModuleLoaded(moduleName: string): boolean {
    try {
      // Try to access the module to see if it's loaded
      return (
        typeof window !== 'undefined' &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__webpack_require__?.cache?.[moduleName] !== undefined
      )
    } catch {
      return false
    }
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (performance as any).memory.usedJSHeapSize || 0
    }
    return 0
  }

  public getAverageMetrics(): Partial<PerformanceMetrics> | null {
    if (this.metrics.length === 0) return null

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        appKitLoadTime: acc.appKitLoadTime + metric.appKitLoadTime,
        connectionTime: acc.connectionTime + metric.connectionTime,
        totalTime: acc.totalTime + metric.totalTime,
        bundleSize: acc.bundleSize + metric.bundleSize,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
      }),
      {
        appKitLoadTime: 0,
        connectionTime: 0,
        totalTime: 0,
        bundleSize: 0,
        memoryUsage: 0,
      }
    )

    const count = this.metrics.length

    return {
      appKitLoadTime: totals.appKitLoadTime / count,
      connectionTime: totals.connectionTime / count,
      totalTime: totals.totalTime / count,
      bundleSize: totals.bundleSize / count,
      memoryUsage: totals.memoryUsage / count,
    }
  }

  public getRecentMetrics(count = 10): PerformanceMetrics[] {
    return this.metrics.slice(-count)
  }

  public clearMetrics(): void {
    this.metrics = []
    this.entries.clear()
  }

  public exportMetrics(): string {
    return JSON.stringify(
      {
        metrics: this.metrics,
        averages: this.getAverageMetrics(),
        timestamp: Date.now(),
      },
      null,
      2
    )
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Export types
export type { PerformanceEntry, PerformanceMetrics }
