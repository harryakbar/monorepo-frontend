# Code Coverage Setup

This repository uses **Codecov** to track and display code coverage for all packages and apps.

## Setup Instructions

### 1. Sign up for Codecov (Free)

1. Go to [codecov.io](https://codecov.io)
2. Sign up with your GitHub account
3. Add your repository: `harryakbar/monorepo-frontend`

### 2. Get Your Codecov Token

1. In Codecov dashboard, go to **Settings** → **General**
2. Copy your **Repository Upload Token**

### 3. Add GitHub Secret

1. Go to your GitHub repository: `https://github.com/harryakbar/monorepo-frontend`
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `CODECOV_TOKEN`
5. Value: Paste your Codecov token
6. Click **Add secret**

### 4. Coverage Reports

Coverage reports are automatically generated and uploaded on:
- Every push to `main` branch
- Every pull request

## Viewing Coverage

### In GitHub

1. **Pull Request Comments**: Codecov automatically comments on PRs with coverage changes
2. **Coverage Badge**: Add to your README:
   ```markdown
   [![codecov](https://codecov.io/gh/harryakbar/monorepo-frontend/branch/main/graph/badge.svg)](https://codecov.io/gh/harryakbar/monorepo-frontend)
   ```

### In Codecov Dashboard

Visit: `https://codecov.io/gh/harryakbar/monorepo-frontend`

## Running Coverage Locally

```bash
# Run tests with coverage for UI package
cd packages/ui
pnpm test:coverage

# View HTML report
open packages/ui/coverage/index.html
```

## Coverage Configuration

- **Target**: 70% coverage
- **Threshold**: 1% change allowed
- **Excluded**: Test files, stories, config files, node_modules

Configuration is in `.codecov.yml`

## Coverage Reports Location

- `packages/ui/coverage/` - UI package coverage
- `apps/*/coverage/` - App-specific coverage (if configured)

## Troubleshooting

### Coverage not showing in GitHub

1. Check that `CODECOV_TOKEN` secret is set correctly
2. Verify the workflow ran successfully
3. Check Codecov dashboard for upload status

### Coverage percentage seems wrong

- Check `.codecov.yml` for ignore patterns
- Verify test files are excluded
- Check that all test files are being run

