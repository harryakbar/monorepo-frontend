# Monorepo

[![codecov](https://codecov.io/gh/harryakbar/monorepo-frontend/branch/main/graph/badge.svg)](https://codecov.io/gh/harryakbar/monorepo-frontend)

A scalable monorepo containing multiple Vite.js applications, each with independent deployments.

## Structure

```
.
├── .github/
│   └── workflows/
│       ├── .deploy-template.yml    # Template for generating workflows
│       └── *.yml                    # Auto-generated workflows per app
├── apps/                            # Applications (deployable)
│   ├── statistics-section/
│   ├── hacker-news-client/
│   └── [future-apps]/
├── packages/                        # Shared packages/libraries
│   └── [shared-code]/
├── scripts/                         # Tooling scripts
│   ├── list-apps.js                 # List all apps
│   ├── get-app-name.js              # Get package name from app dir
│   └── create-workflow.js           # Generate GitHub Actions workflow
├── package.json                     # Root package.json
├── pnpm-workspace.yaml              # pnpm workspace configuration
├── turbo.json                       # Turborepo configuration
└── README.md                        # This file
```

## Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Installation

Install all dependencies for all workspaces:

```bash
pnpm install
```

## Development

### Run all apps

```bash
pnpm dev
```

### Run specific app

```bash
# Using pnpm filter (recommended for many apps)
pnpm --filter <package-name> dev

# Or using turbo
turbo run dev --filter=<package-name>
```

### List all apps

```bash
pnpm apps:list
```

## Building

### Build all apps

```bash
pnpm build
```

### Build specific app

```bash
pnpm --filter <package-name> build
```

## Linting

### Lint all apps

```bash
pnpm lint
```

### Lint specific app

```bash
pnpm --filter <package-name> lint
```

## Adding a New App

1. **Create the app directory:**

   ```bash
   mkdir -p apps/my-new-app
   cd apps/my-new-app
   # Initialize your Vite project here
   ```

2. **Update package.json:**
   - Set a unique `name` field (e.g., `@monorepo/my-new-app` or `my-new-app`)
   - Ensure it has the standard scripts: `dev`, `build`, `lint`, etc.

3. **Generate deployment workflow:**

   ```bash
   node scripts/create-workflow.js my-new-app
   ```

4. **Install dependencies:**
   ```bash
   pnpm install
   ```

That's it! The app is now part of the monorepo and will be included in all workspace commands.

## Adding a Shared Package

1. **Create the package directory:**

   ```bash
   mkdir -p packages/my-shared-package
   cd packages/my-shared-package
   ```

2. **Create package.json:**

   ```json
   {
     "name": "@monorepo/my-shared-package",
     "version": "1.0.0",
     "main": "./index.ts",
     "types": "./index.ts"
   }
   ```

3. **Use in apps:**
   ```json
   {
     "dependencies": {
       "@monorepo/my-shared-package": "workspace:*"
     }
   }
   ```

## Deployment

You have two deployment options:

### Option 1: Subdirectory Deployment (Current)

All apps deploy to the same GitHub Pages site at different paths:

- `https://harryakbar.github.io/monorepo-frontend/statistics-section/`
- `https://harryakbar.github.io/monorepo-frontend/hacker-news-client/`
- `https://harryakbar.github.io/monorepo-frontend/testimonial-card/`

### Option 2: Subdomain Deployment

Each app deploys to its own subdomain:

- `https://statistics.yourdomain.com`
- `https://hacker-news.yourdomain.com`

See [SUBDOMAIN_DEPLOYMENT.md](./SUBDOMAIN_DEPLOYMENT.md) for setup instructions.

---

### Unified Deployment (Recommended for Subdirectories)

A single workflow (`deploy-all.yml`) builds and deploys **all apps together**. This ensures:

- ✅ All apps are always deployed together
- ✅ No overwriting issues between separate deployments
- ✅ Consistent deployment state
- ✅ Automatic discovery of all apps in `apps/` directory

The unified workflow triggers on:

- Changes to any app in `apps/`
- Changes to shared packages in `packages/`
- Changes to `turbo.json`
- Manual trigger via GitHub Actions UI

**Access your apps at:**

- `https://harryakbar.github.io/monorepo-frontend/statistics-section/`
- `https://harryakbar.github.io/monorepo-frontend/hacker-news-client/`
- `https://harryakbar.github.io/monorepo-frontend/testimonial-card/`

### Individual App Deployment (Optional)

Individual workflows are also available for each app (`statistics-section.yml`, `hacker-news-client.yml`) for quick single-app deployments. However, **using the unified workflow is recommended** to avoid deployment conflicts.

Workflows are auto-generated from the template. To regenerate:

```bash
node scripts/create-workflow.js <app-directory-name>
```

## Benefits of This Structure

✅ **Scalable**: Easy to add new apps without modifying root scripts  
✅ **Efficient**: Turborepo provides intelligent caching and task orchestration  
✅ **Independent**: Each app deploys independently  
✅ **Shared Code**: `packages/` directory for reusable code  
✅ **Automated**: Workflow generation script for new apps  
✅ **Type-Safe**: Shared TypeScript configs and types

## Tools

- **pnpm**: Package manager with workspace support
- **Turborepo**: Build system with intelligent caching
- **Vite**: Fast build tool for each app

## Scripts Reference

| Command                                           | Description                               |
| ------------------------------------------------- | ----------------------------------------- |
| `pnpm dev`                                        | Run all apps in development mode          |
| `pnpm build`                                      | Build all apps                            |
| `pnpm lint`                                       | Lint all apps                             |
| `pnpm apps:list`                                  | List all apps in the monorepo             |
| `node scripts/create-workflow.js <app>`           | Generate subdirectory workflow for an app |
| `node scripts/create-subdomain-workflow.js <app>` | Generate subdomain workflow for an app    |
