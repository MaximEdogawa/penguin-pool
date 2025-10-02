# Code Style Guide

This document outlines the comprehensive code style guide for the Penguin Pool project, emphasizing functional programming principles, composability, and maintainability.

## Core Principles

### 1. No Comments

- **Rule**: Remove all comments from production code
- **Rationale**: Code should be self-documenting through clear naming and structure
- **Implementation**: Use descriptive variable and function names instead of explanatory comments

### 2. No Console Logs

- **Rule**: Eliminate all console.log, console.warn, console.error statements
- **Rationale**: Prevent debug information from reaching production and maintain clean output
- **Implementation**: Use proper logging libraries for production logging needs

### 3. Early Returns (Guard Clauses)

- **Rule**: Use early returns to reduce nesting and improve readability
- **Rationale**: Eliminates deep nesting, makes code flow clearer, reduces cognitive load
- **Implementation**: Handle error cases and edge cases at the beginning of functions

### 4. No For/While Loops

- **Rule**: Avoid traditional for and while loops when possible
- **Rationale**: Functional approaches are more declarative and less error-prone
- **Implementation**: Use array methods like map, filter, reduce, forEach

### 5. Use Recursion or Functional Programming

- **Rule**: Prefer recursive solutions and functional programming patterns over imperative loops
- **Rationale**: More predictable, easier to test, and often more elegant
- **Implementation**: Implement recursive solutions for iterative problems, use higher-order functions

### 6. File Length Limit: 1000 Lines

- **Rule**: Keep each file under 1000 lines of code
- **Rationale**: Improves readability, maintainability, and encourages proper separation of concerns
- **Implementation**: Break large files into smaller, focused modules

### 7. Use Composables

- **Rule**: Create reusable composable functions and utilities
- **Rationale**: Promotes code reuse, testability, and modularity
- **Implementation**: Extract common logic into composable functions that can be combined

### 8. Encapsulation

- **Rule**: Encapsulate data and behavior when possible
- **Rationale**: Reduces coupling, improves maintainability, and prevents unwanted side effects
- **Implementation**: Use closures, modules, or classes to hide internal implementation details

### 9. Pure Functions

- **Rule**: Prefer pure functions over functions with side effects
- **Rationale**: Easier to test, debug, and reason about; more predictable behavior
- **Implementation**: Functions should not modify external state and should return consistent outputs for given inputs

### 10. Type Definitions

- **Rule**: Never use `any`
- **Rationale**: We should use types for everything
- **Implementation**: Add interface and types

## Examples

### ❌ Before (Violates Style Guide)

```typescript
// Process user data with validation
function processUsers(users) {
  console.log('Processing users:', users.length)

  let validUsers = []

  // Loop through all users
  for (let i = 0; i < users.length; i++) {
    const user = users[i]
    if (user) {
      if (user.isActive) {
        if (user.hasPermission) {
          user.lastProcessed = new Date() // Side effect
          validUsers.push(user)
        }
      }
    }
  }

  return validUsers
}
```

### ✅ After (Follows Style Guide)

```typescript
const isValidUser = user => user && user.isActive && user.hasPermission

const addProcessedTimestamp = user => ({
  ...user,
  lastProcessed: new Date(),
})

const processUsers = users => users.filter(isValidUser).map(addProcessedTimestamp)
```

### Composable Example

```typescript
const createUserValidator = rules => user => rules.every(rule => rule(user))

const createUserProcessor = (validator, transformer) => users =>
  users.filter(validator).map(transformer)

const hasPermission = user => user.hasPermission
const isActive = user => user.isActive
const exists = user => Boolean(user)

const userValidator = createUserValidator([exists, isActive, hasPermission])
const userProcessor = createUserProcessor(userValidator, addProcessedTimestamp)
```

### Recursive Example

```typescript
const findUserById = (users, targetId) => {
  if (!users.length) return null

  const [first, ...rest] = users
  return first.id === targetId ? first : findUserById(rest, targetId)
}
```

## ESLint Configuration

The project uses ESLint with the following rules to enforce the style guide:

```typescript
rules: {
  'no-console': 'error',
  'no-debugger': 'error',
  'max-lines': ['error', { max: 1000, skipBlankLines: true, skipComments: true }],
  'complexity': ['error', { max: 30 }],
  'max-depth': ['error', { max: 10 }],
  'max-params': ['error', { max: 10 }],
  'no-var': 'error',
  'prefer-const': 'error',
  'prefer-arrow-callback': 'error',
  'prefer-template': 'error',
  'no-useless-return': 'error',
  'no-useless-concat': 'error',
  'prefer-destructuring': ['error', { object: true, array: false }],
  'no-loop-func': 'error',
  'no-iterator': 'error',
  'no-restricted-syntax': [
    'error',
    {
      selector: 'ForStatement',
      message: 'Use functional programming methods like map, filter, reduce instead of for loops'
    },
    {
      selector: 'WhileStatement',
      message: 'Use functional programming methods or recursion instead of while loops'
    },
    {
      selector: 'DoWhileStatement',
      message: 'Use functional programming methods or recursion instead of do-while loops'
    }
  ],
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/prefer-function-type': 'error',
  '@typescript-eslint/prefer-readonly': 'error',
  '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'vue/max-lines-per-block': ['error', {
    template: { max: 200 },
    script: { max: 400 },
    style: { max: 200 }
  }]
}
```

## Implementation Strategy

### Gradual Rollout

- Apply rules to new code immediately
- Refactor existing code incrementally
- Use automated enforcement with pre-commit hooks and CI checks

### Code Review Focus

- Prioritize these standards in all pull requests
- Use pair programming sessions to spread knowledge of functional patterns

### Tools and Configurations

- ESLint rules: No-console, max-lines, complexity limits
- Prettier: Consistent formatting
- Pre-commit hooks: Automatic style checking
- CI/CD integration: Fail builds on style violations

## Notes

- This style guide emphasizes functional programming and composability
- Focus on creating small, testable, reusable functions
- Prioritize readability and maintainability over clever solutions
- Consider performance implications of recursive solutions for large datasets
- Team training is crucial for successful adoption of functional programming patterns

## Benefits

Following this style guide will result in:

- **Cleaner Code**: Self-documenting, readable code without comments
- **Better Maintainability**: Smaller files, pure functions, and clear separation of concerns
- **Improved Testing**: Pure functions are easier to test and debug
- **Enhanced Performance**: Functional approaches often perform better
- **Team Productivity**: Consistent patterns reduce cognitive load and speed up development
