#!/usr/bin/env node
/**
 * Generate a GitHub Actions workflow for an app
 * Usage: node scripts/create-workflow.js <app-directory-name>
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

const appDir = process.argv[2];
if (!appDir) {
  console.error('Usage: node scripts/create-workflow.js <app-directory-name>');
  process.exit(1);
}

try {
  // Get package name
  const packageJsonPath = join(rootDir, 'apps', appDir, 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const packageName = packageJson.name || appDir;
  
  // Generate app name (human-readable)
  const appName = appDir
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Read template
  const templatePath = join(rootDir, '.github', 'workflows', '.deploy-template.yml');
  const template = readFileSync(templatePath, 'utf-8');

  // Replace placeholders
  const workflow = template
    .replace(/\{\{APP_NAME\}\}/g, appName)
    .replace(/\{\{APP_DIR\}\}/g, appDir)
    .replace(/\{\{APP_PACKAGE_NAME\}\}/g, packageName);

  // Write workflow
  const workflowPath = join(rootDir, '.github', 'workflows', `${appDir}.yml`);
  writeFileSync(workflowPath, workflow);
  
  console.log(`✅ Created workflow: .github/workflows/${appDir}.yml`);
} catch (error) {
  console.error('Error creating workflow:', error.message);
  process.exit(1);
}

