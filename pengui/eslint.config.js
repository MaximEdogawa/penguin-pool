import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactNative from 'eslint-plugin-react-native'

export default [
  js.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.tamagui/**',
      '**/*.d.ts',
      'tests/**',
      '**/*.test.*',
      '**/*.spec.*',
      'playwright.component.config.ts',
      'metro.config.js',
      'metro.config.cjs',
      'babel.config.js',
      'babel.config.cjs',
      'tamagui.config.ts',
      'tamagui-web.css',
      '**/tamagui.config.cjs',
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      react: react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-var-requires': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/split-platform-components': 'warn',
      'react-native/no-inline-styles': 'warn',
      'react-native/no-color-literals': 'warn',
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-undef': 'off', // TypeScript handles this
      eqeqeq: ['warn', 'always'],
      curly: ['warn', 'all'],
      'brace-style': ['warn', '1tbs'],
      'comma-dangle': ['warn', 'always-multiline'],
      semi: ['warn', 'never'],
      quotes: ['warn', 'single'],
      indent: ['warn', 2],
      'max-len': ['warn', { code: 120 }],
      'object-curly-spacing': ['warn', 'always'],
      'array-bracket-spacing': ['warn', 'never'],
    },
  },
]
