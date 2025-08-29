# Pre-commit Hooks Documentation

## Overview

This project uses **Husky** and **lint-staged** to automatically run code quality checks before each commit. This ensures that all committed code follows our coding standards and passes tests.

## 🚀 What Happens on Commit

When you run `git commit`, the following happens automatically:

1. **Code Formatting** - Prettier formats your code according to our style guide
2. **Linting** - ESLint checks for code quality and style issues
3. **Unit Tests** - Vitest runs all unit tests to ensure nothing is broken

## 🛠️ Tools Used

### Husky

- **Purpose**: Git hooks manager
- **What it does**: Automatically runs scripts at specific Git lifecycle events
- **Configuration**: `.husky/` directory contains hook scripts

### lint-staged

- **Purpose**: Run linters on staged files only
- **What it does**: Only processes files that are actually being committed
- **Performance**: Much faster than running on entire codebase

### Prettier

- **Purpose**: Code formatter
- **What it does**: Automatically formats code to consistent style
- **Configuration**: `.prettierrc` file defines formatting rules

### ESLint

- **Purpose**: Code linter and quality checker
- **What it does**: Finds and fixes code quality issues
- **Configuration**: `.eslintrc.js` and package.json scripts

## 📁 Configuration Files

### `.husky/pre-commit`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# Run lint-staged to format and lint staged files
echo "📝 Formatting and linting staged files..."
npx lint-staged

# Run unit tests
echo "🧪 Running unit tests..."
npm run test:run

echo "✅ Pre-commit checks completed successfully!"
```

### `.husky/commit-msg`

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Conventional commit message format
commit_regex='^(feat|fix|docs|style|refactor|test|chore|ci|build|perf|revert)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ Invalid commit message format!"
    # ... validation logic
    exit 1
fi

echo "✅ Commit message format is valid!"
```

### `package.json` - lint-staged configuration

```json
{
  "lint-staged": {
    "*.{vue,js,ts,jsx,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

### `.prettierrc`

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "vueIndentScriptAndStyle": true
}
```

## 🎯 Available Scripts

### Development

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Code Quality

```bash
npm run format           # Format all code with Prettier
npm run format:check     # Check if code is formatted (CI)
npm run lint             # Lint and auto-fix code
npm run lint:check       # Check for linting issues (CI)
```

### Testing

```bash
npm run test             # Run tests in watch mode
npm run test:run         # Run tests once (CI)
npm run test:coverage    # Run tests with coverage
npm run test:ui          # Run tests with UI
```

### Pre-commit

```bash
npm run pre-commit       # Run all pre-commit checks manually
```

## 🔧 How to Use

### Normal Development Workflow

1. **Make changes** to your code
2. **Stage files** with `git add .` or `git add <specific-files>`
3. **Commit** with `git commit -m "feat: add new feature"`
4. **Pre-commit hooks run automatically**:
   - Code is formatted
   - Linting issues are fixed
   - Tests are run
   - If any step fails, commit is blocked

### Manual Pre-commit Check

If you want to run pre-commit checks manually:

```bash
npm run pre-commit
```

This runs:

- `npm run format` - Format code
- `npm run lint:fix` - Fix linting issues
- `npm run test:run` - Run unit tests

### Individual Checks

```bash
# Format code only
npm run format

# Check formatting without changing files
npm run format:check

# Lint and fix code
npm run lint

# Check linting without fixing
npm run lint:check

# Run tests
npm run test:run
```

## 📝 Commit Message Format

We use **Conventional Commits** format:

```
<type>(<scope>): <description>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes
- `build`: Build system changes
- `perf`: Performance improvements
- `revert`: Revert previous commit

### Examples

```bash
git commit -m "feat(dashboard): add user balance display"
git commit -m "fix(auth): resolve login validation issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "style(components): format Vue components"
git commit -m "test(store): add unit tests for user store"
```

## 🚨 Troubleshooting

### Pre-commit Hook Fails

If the pre-commit hook fails:

1. **Check the error message** - it will tell you what failed
2. **Fix the issues** manually:
   ```bash
   npm run format          # Fix formatting
   npm run lint:fix        # Fix linting
   npm run test:run        # Fix tests
   ```
3. **Stage the fixes** and try committing again

### Common Issues

#### Formatting Issues

```bash
npm run format:check      # See what needs formatting
npm run format            # Fix formatting
```

#### Linting Issues

```bash
npm run lint:check        # See linting errors
npm run lint              # Auto-fix what can be fixed
```

#### Test Failures

```bash
npm run test:ui           # Run tests with UI to debug
npm run test:run          # Run tests in terminal
```

### Bypassing Hooks (Emergency Only)

⚠️ **Warning**: Only use this in emergencies!

```bash
git commit --no-verify -m "emergency: bypass hooks for critical fix"
```

## 🔄 Updating Hooks

### Add New Hooks

1. Create new hook file in `.husky/` directory
2. Make it executable: `chmod +x .husky/new-hook`
3. Update package.json scripts if needed

### Modify Existing Hooks

1. Edit the hook file in `.husky/` directory
2. Test with `npm run pre-commit`
3. Commit the changes

### Remove Hooks

1. Delete the hook file from `.husky/` directory
2. Remove related scripts from package.json
3. Commit the changes

## 📚 Best Practices

### For Developers

1. **Always run pre-commit checks** before pushing
2. **Use conventional commit messages** for better history
3. **Fix issues locally** before committing
4. **Keep hooks fast** - avoid heavy operations

### For Team Leads

1. **Enforce hook usage** in CI/CD
2. **Regularly review and update** hook configurations
3. **Monitor hook performance** and optimize if needed
4. **Document any customizations** for the team

### For CI/CD

1. **Run the same checks** in CI as in pre-commit hooks
2. **Use the same tools and versions** locally and in CI
3. **Fail fast** if any check fails
4. **Provide clear error messages** for failed checks

## 🎉 Benefits

### Code Quality

- **Consistent formatting** across the entire codebase
- **Early detection** of code quality issues
- **Automated fixes** for common problems

### Team Productivity

- **Reduced code review time** - less formatting discussions
- **Faster debugging** - consistent code style
- **Better collaboration** - everyone follows same standards

### Project Health

- **Prevents bad code** from entering the repository
- **Maintains test coverage** - tests run on every commit
- **Clean git history** - well-formatted commit messages

## 🔗 Related Documentation

- [ESLint Configuration](./ESLINT_CONFIG.md)
- [Prettier Configuration](./PRETTIER_CONFIG.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [Git Workflow](./GIT_WORKFLOW.md)

---

**Note**: This documentation is automatically generated and updated. For the most current information, check the actual configuration files in the project.
