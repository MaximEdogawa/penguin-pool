import fs from 'fs'

const filePath = 'src/features/walletConnect/services/CommandHandler.ts'
let content = fs.readFileSync(filePath, 'utf8')

// Fix all remaining parameter issues
content = content.replace(/params: unknown,/g, '_params: unknown,')
content = content.replace(
  /context: HandlerContext\n  \): Promise<unknown> => {/g,
  '_context: HandlerContext\n  ): Promise<unknown> => {'
)
content = content.replace(/__params/g, '_params')

fs.writeFileSync(filePath, content)
console.log('Fixed all remaining parameter issues')
