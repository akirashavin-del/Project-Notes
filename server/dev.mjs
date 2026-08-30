import { spawn } from 'node:child_process';

const server = spawn('node', ['server/index.mjs'], { stdio: 'inherit' });
const vite = spawn('npx', ['vite'], { stdio: 'inherit', shell: true });

const cleanup = () => {
  server.kill();
  vite.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
