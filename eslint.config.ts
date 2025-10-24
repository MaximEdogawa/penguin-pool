import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['src/**/*.{ts,mts,tsx,vue}', 'backend/src/**/*.{ts,mts,tsx}'],
  },

  globalIgnores([
    '**/dist/**',
    '**/dist-ssr/**',
    '**/coverage/**',
    '**/tests/**',
    '**/playwright.component.config.ts',
    '**/node_modules/**',
    '**/*.d.ts',
  ]),

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,

  {
    name: 'app/style-guide-rules',
    rules: {
      'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }],
      'no-console': 'error',
      'no-debugger': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'no-useless-return': 'error',
      'no-useless-concat': 'error',
      'no-loop-func': 'error',
      'no-iterator': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ForStatement',
          message:
            'Use functional programming methods like map, filter, reduce instead of for loops',
        },
        {
          selector: 'WhileStatement',
          message: 'Use functional programming methods or recursion instead of while loops',
        },
        {
          selector: 'DoWhileStatement',
          message: 'Use functional programming methods or recursion instead of do-while loops',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'vue/max-lines-per-block': [
        'error',
        {
          template: 1000,
          script: 1000,
          style: 1000,
        },
      ],
    },
  }
)
