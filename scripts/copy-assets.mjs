import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const srcPublic = resolve(rootDir, "src", "public");
const distPublic = resolve(rootDir, "dist", "public");

if (existsSync(srcPublic)) {
  mkdirSync(distPublic, { recursive: true });
  cpSync(srcPublic, distPublic, { recursive: true });
}
