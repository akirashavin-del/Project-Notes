import { existsSync, readFileSync } from 'node:fs';

// Vite loads .env.local for the browser; Node does not, so the tiny server loads it here.
for (const filename of ['.env.local', '.env']) {
  if (!existsSync(filename)) continue;
  for (const line of readFileSync(filename, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
}

if (!process.env.GOOGLE_API_KEY && process.env.GEMINI_API_KEY) process.env.GOOGLE_API_KEY = process.env.GEMINI_API_KEY;
