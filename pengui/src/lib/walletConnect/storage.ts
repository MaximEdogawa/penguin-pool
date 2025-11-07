export class CustomWalletConnectStorage {
  private prefix: string

  constructor(prefix: string) {
    this.prefix = prefix
  }

  private getPrefixedKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  async getKeys(): Promise<string[]> {
    const keys: string[] = []
    Array.from({ length: localStorage.length }).forEach((_, i) => {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${this.prefix}:`)) {
        keys.push(key.substring(this.prefix.length + 1))
      }
    })
    return keys
  }

  async getEntries<T = unknown>(): Promise<[string, T][]> {
    const entries: [string, T][] = []
    Array.from({ length: localStorage.length }).forEach((_, i) => {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${this.prefix}:`)) {
        const rawValue = localStorage.getItem(key)
        const value = rawValue ? JSON.parse(rawValue) : undefined
        entries.push([key.substring(this.prefix.length + 1), value])
      }
    })
    return entries
  }

  async getItem<T = unknown>(key: string): Promise<T | undefined> {
    const prefixedKey = this.getPrefixedKey(key)
    const rawValue = localStorage.getItem(prefixedKey)
    return rawValue ? JSON.parse(rawValue) : undefined
  }

  async setItem<T = unknown>(key: string, value: T): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key)
    localStorage.setItem(prefixedKey, JSON.stringify(value))
  }

  async removeItem(key: string): Promise<void> {
    const prefixedKey = this.getPrefixedKey(key)
    localStorage.removeItem(prefixedKey)
  }
}
