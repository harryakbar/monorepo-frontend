#!/usr/bin/env node
/**
 * List all apps in the monorepo
 */
import { readdir } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const appsDir = join(rootDir, "apps");

try {
  const apps = await readdir(appsDir, { withFileTypes: true });
  const appNames = apps
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  console.log(appNames.join("\n"));
} catch (error) {
  console.error("Error reading apps directory:", error.message);
  process.exit(1);
}
