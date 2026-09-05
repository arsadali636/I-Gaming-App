#!/usr/bin/env node
// Standalone seed script for iGaming Connect database
// Usage: node scripts/seed.js

const { execSync } = require("child_process");
const path = require("path");

const cwd = path.resolve(__dirname, "..");

try {
  console.log("Seeding iGaming Connect database...");
  execSync("npx tsx src/lib/seed.ts", { stdio: "inherit", cwd });
  console.log("\nDone! You can now start the app with: npm run dev");
} catch (err) {
  console.error("Seed failed:", err.message);
  process.exit(1);
}
