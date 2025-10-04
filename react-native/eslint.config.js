import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'

export default [
  {
    name: 'react-native/metro-config',
    files: ['metro.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
  {
    name: 'react-native/files-to-lint',
    files: ['src/**/*.{ts,mts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        __DEV__: 'readonly',
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        clearTimeout: 'readonly',
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        React: 'readonly',
        HTMLElement: 'readonly',
        IntersectionObserver: 'readonly',
        __d: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // Same rules as root project
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
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          args: 'none',
        },
      ],
    },
  },
]
