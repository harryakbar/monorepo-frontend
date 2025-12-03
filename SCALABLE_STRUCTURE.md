# Scalable Monorepo Structure

## Overview

This monorepo has been restructured to support **5+ applications** efficiently. The new structure eliminates the need for hardcoded scripts and provides automated tooling.

## Key Improvements

### 1. **Turborepo Integration**
- Intelligent task orchestration and caching
- Parallel execution of tasks
- Only rebuilds what changed
- Faster CI/CD pipelines

### 2. **Dynamic Scripts**
- No more hardcoded `dev:app1`, `dev:app2`, etc.
- Use `pnpm --filter <package-name>` or `turbo run dev --filter=<package-name>`
- Works with any number of apps

### 3. **Workflow Generation**
- Template-based workflow generation
- Run `node scripts/create-workflow.js <app-name>` to create a new workflow
- Consistent deployment configuration across all apps

### 4. **Shared Packages**
- `packages/` directory for reusable code
- Share components, utilities, types, and configs
- Use workspace protocol: `"@monorepo/package": "workspace:*"`

## Structure Comparison

### Before (Not Scalable)
```
package.json:
  "dev:statistics": "..."
  "dev:hacker-news": "..."
  "dev:app3": "..."  ← Need to add manually
  "dev:app4": "..."  ← Need to add manually
  ...
```

### After (Scalable)
```
package.json:
  "dev": "turbo run dev"  ← Works for all apps automatically
```

## Adding a New App (3 Steps)

1. **Create app in `apps/` directory**
2. **Generate workflow:** `node scripts/create-workflow.js my-app`
3. **Done!** The app is automatically included in all commands

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| Adding new app | Modify package.json | Just create directory |
| Build caching | None | Turborepo cache |
| Workflow setup | Manual copy/paste | Auto-generated |
| Shared code | Copy/paste | `packages/` directory |
| Script maintenance | O(n) complexity | O(1) complexity |

## Usage Examples

### Run specific app
```bash
# Old way (doesn't scale)
pnpm dev:statistics

# New way (scales infinitely)
pnpm --filter @monorepo/statistics-section dev
# or
turbo run dev --filter=@monorepo/statistics-section
```

### List all apps
```bash
pnpm apps:list
```

### Generate workflow for new app
```bash
node scripts/create-workflow.js my-new-app
```

## Migration Notes

Existing apps continue to work. The old scripts (`dev:statistics`, etc.) can be removed, but they'll still work if you prefer to keep them for convenience.

## Next Steps

1. Install Turborepo: `pnpm add -D -w turbo`
2. Test the new structure: `pnpm build`
3. Add more apps as needed - no configuration required!

