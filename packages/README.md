# Packages

This directory contains shared packages and libraries that can be used across multiple apps in the monorepo.

## Usage

Packages in this directory can be imported by apps using the workspace protocol:

```json
{
  "dependencies": {
    "@monorepo/shared-utils": "workspace:*"
  }
}
```

## Creating a New Package

1. Create a new directory:

   ```bash
   mkdir packages/my-package
   ```

2. Create `package.json`:

   ```json
   {
     "name": "@monorepo/my-package",
     "version": "1.0.0",
     "main": "./index.ts",
     "types": "./index.ts",
     "exports": {
       ".": "./index.ts"
     }
   }
   ```

3. Add to your app's dependencies:

   ```json
   {
     "dependencies": {
       "@monorepo/my-package": "workspace:*"
     }
   }
   ```

4. Run `pnpm install` to link the package.

## Example Packages

- **@monorepo/ui-components**: Shared React components
- **@monorepo/utils**: Utility functions
- **@monorepo/types**: Shared TypeScript types
- **@monorepo/config**: Shared configuration (ESLint, TypeScript, etc.)
