#!/usr/bin/env node
/**
 * Get the package name from an app directory
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

const appName = process.argv[2];
if (!appName) {
  console.error("Usage: get-app-name.js <app-directory-name>");
  process.exit(1);
}

try {
  const packageJsonPath = join(rootDir, "apps", appName, "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
  console.log(packageJson.name || appName);
} catch (error) {
  // Fallback to directory name if package.json doesn't exist or has no name
  console.log(appName);
}
