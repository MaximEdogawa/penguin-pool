import fs from 'fs'

const filePath = 'src/features/walletConnect/services/CommandHandler.ts'
let content = fs.readFileSync(filePath, 'utf8')

// Fix all remaining context parameters
content = content.replace(
  /context: HandlerContext\n  \): Promise<unknown> => {/g,
  '_context: HandlerContext\n  ): Promise<unknown> => {'
)

fs.writeFileSync(filePath, content)
console.log('Fixed all final context parameter issues')
