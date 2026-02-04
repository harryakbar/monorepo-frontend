# @repo/ui

Shared UI component library for the monorepo. Built with React, TypeScript, and Tailwind CSS.

## Installation

From another workspace package:

```bash
pnpm -w --filter <consumer> add @repo/ui
```

## Usage

```tsx
import { Button, Input, Card, Badge } from '@repo/ui';

function App() {
  return (
    <Button variant="primary">Click me</Button>
  );
}
```

## Requirements

This package uses **Tailwind CSS** for styling. Consuming applications must:

1. Install Tailwind CSS v4:
   ```bash
   pnpm add -D tailwindcss@^4.0.0 @tailwindcss/vite@^4.0.0
   ```

2. Configure Tailwind in your Vite config:
   ```ts
   import tailwindcss from '@tailwindcss/vite';
   
   export default defineConfig({
     plugins: [tailwindcss()],
   });
   ```

3. Import Tailwind CSS in your app:
   ```css
   @import "tailwindcss" source(none);
   @source "../**/*.{js,ts,jsx,tsx}";
   @source "../../packages/ui/**/*.{js,ts,jsx,tsx}";
   ```

## Available Components

- `Button` - Button component with variants (primary, secondary, outline, ghost, destructive)
- `Input` - Input field with label, error states, and password toggle
- `Card` - Card container with optional title and footer
- `Badge` - Badge/label component with color variants
- `Counter` - Simple counter component

## Development

```bash
pnpm install
pnpm -w -F @repo/ui lint
```
