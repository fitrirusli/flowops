import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { php, root } from './runtime.mjs';

const apiDirectory = path.join(root, 'apps/api');
const vite = path.join(root, 'apps/web/node_modules/vite/bin/vite.js');
if (
  !existsSync(path.join(apiDirectory, '.env')) ||
  !existsSync(path.join(apiDirectory, 'vendor/autoload.php')) ||
  !existsSync(vite)
) {
  console.error(
    'The project is not configured. Follow docs/LOCAL_DEVELOPMENT.md and run npm run setup first.',
  );
  process.exit(1);
}

async function portInUse(port) {
  return new Promise((resolve) => {
    const connection = net.createConnection({ port, host: '127.0.0.1' });
    connection.once('connect', () => {
      connection.destroy();
      resolve(true);
    });
    connection.once('error', () => resolve(false));
  });
}

for (const port of [8011, 5173]) {
  if (await portInUse(port))
    throw new Error(
      `Port ${port} is in use. Stop the existing development server before running npm run dev.`,
    );
}

const pgBin = path.join(root, '.local/runtime/postgresql/pgsql/bin');
const pgData = path.join(root, '.local/postgres');
const pgControl = path.join(pgBin, 'pg_ctl.exe');
let startedPostgres = false;
mkdirSync(path.join(root, '.local'), { recursive: true });
if (existsSync(pgControl) && existsSync(path.join(pgData, 'PG_VERSION'))) {
  const check = spawnSync(path.join(pgBin, 'pg_isready.exe'), ['-h', '127.0.0.1', '-p', '55432'], {
    windowsHide: true,
    stdio: 'ignore',
  });
  if (check.status !== 0) {
    const start = spawnSync(
      pgControl,
      [
        '-D',
        pgData,
        '-l',
        path.join(root, '.local/postgres.log'),
        '-o',
        '-p 55432 -h 127.0.0.1',
        'start',
      ],
      { windowsHide: true, stdio: 'inherit' },
    );
    if (start.status !== 0) throw new Error('The isolated PostgreSQL server could not be started.');
    startedPostgres = true;
  }
}

const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  if (startedPostgres)
    spawnSync(pgControl, ['-D', pgData, 'stop', '-m', 'fast'], {
      stdio: 'ignore',
      windowsHide: true,
    });
  process.exitCode = code;
}
function start(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
    env: process.env,
  });
  children.push(child);
  child.on('error', (error) => {
    console.error(error.message);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping) stop(code || 0);
  });
}
start(
  php,
  [
    '-S',
    '127.0.0.1:8011',
    '-t',
    path.join(apiDirectory, 'public'),
    path.join(root, 'infra/router.php'),
  ],
  apiDirectory,
);
start(
  process.execPath,
  [vite, '--host', '127.0.0.1', '--port', '5173'],
  path.join(root, 'apps/web'),
);
console.log(
  '\nFlowOps workspace: http://127.0.0.1:5173\nAPI: http://127.0.0.1:8011\nPress Ctrl+C to stop both servers.\n',
);
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
