# Quick Start Guide

## For 5+ Apps - This Structure Scales!

### Adding a New App (3 Steps)

```bash
# 1. Create your app (use Vite, Next.js, etc.)
mkdir -p apps/my-new-app
cd apps/my-new-app
# ... initialize your project ...

# 2. Generate deployment workflow
cd ../..
node scripts/create-workflow.js my-new-app

# 3. Install dependencies
pnpm install
```

**That's it!** Your app is now part of the monorepo.

### Running Apps

```bash
# All apps
pnpm dev              # Development
pnpm build            # Build
pnpm lint             # Lint

# Specific app
pnpm --filter <package-name> dev
turbo run dev --filter=<package-name>
```

### List All Apps

```bash
pnpm apps:list
```

### Creating Shared Packages

```bash
mkdir packages/my-shared-package
cd packages/my-shared-package
# Create package.json with name: "@monorepo/my-shared-package"
# Use in apps: "@monorepo/my-shared-package": "workspace:*"
```

## Key Files

- `turbo.json` - Task orchestration config
- `pnpm-workspace.yaml` - Workspace configuration
- `.github/workflows/.deploy-template.yml` - Workflow template
- `scripts/create-workflow.js` - Auto-generate workflows

## Benefits

✅ No hardcoded scripts - scales to 100+ apps  
✅ Turborepo caching - faster builds  
✅ Auto-generated workflows - consistent deployments  
✅ Shared packages - DRY code  
✅ Independent deployments - each app deploys separately
