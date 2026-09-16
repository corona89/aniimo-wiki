#!/usr/bin/env node
// Generate an ADMIN_PASSWORD_HASH value for credentials login.
// Usage: node scripts/hash-password.mjs "your-password"
import crypto from "node:crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hash-password.mjs "your-password"');
  process.exit(1);
}

const salt = crypto.randomBytes(16);
const derived = crypto.scryptSync(password, salt, 64);
const hash = `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;

console.log("\nSet this as the ADMIN_PASSWORD_HASH secret:\n");
console.log(hash + "\n");
