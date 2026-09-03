import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadEnvironmentFile(filePath = resolve(process.cwd(), '.env')): void {
  if (existsSync(filePath)) {
    process.loadEnvFile(filePath);
  }
}
