import fs from 'fs'

const filePath = 'src/features/walletConnect/services/CommandHandler.ts'
let content = fs.readFileSync(filePath, 'utf8')

// Fix all parameter issues comprehensively
content = content.replace(/__params/g, '_params')
content = content.replace(/params: unknown,/g, '_params: unknown,')
content = content.replace(
  /context: HandlerContext\n  \): Promise<unknown> => {/g,
  '_context: HandlerContext\n  ): Promise<unknown> => {'
)

// Fix specific patterns that might have been missed
content = content.replace(/  __params: unknown,/g, '  _params: unknown,')
content = content.replace(
  /  context: HandlerContext\n  \): Promise<unknown> => {/g,
  '  _context: HandlerContext\n  ): Promise<unknown> => {'
)

fs.writeFileSync(filePath, content)
console.log('Fixed all comprehensive parameter issues')
