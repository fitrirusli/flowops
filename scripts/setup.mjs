import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import { composerPath, npmCli, php, root, run } from './runtime.mjs';

const api = path.join(root, 'apps/api');
for (const port of [8011, 5173]) {
  const inUse = await new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
  });
  if (inUse)
    throw new Error(
      `Stop the development server on port ${port} before running setup. Windows may lock native dependency files while Vite is running.`,
    );
}
const check = spawnSync(php, ['-r', 'echo PHP_VERSION_ID;'], {
  encoding: 'utf8',
  windowsHide: true,
});
if (check.status !== 0 || Number(check.stdout) < 80300)
  throw new Error(
    'PHP 8.3 or newer with pdo_pgsql is required. Set FLOWOPS_PHP to a compatible PHP executable.',
  );
if (!existsSync(path.join(api, '.env'))) {
  copyFileSync(path.join(api, '.env.example'), path.join(api, '.env'));
  console.log(
    'Created apps/api/.env. Configure its dedicated PostgreSQL database credentials, then run npm run setup again.',
  );
  process.exit(0);
}
const environment = readFileSync(path.join(api, '.env'), 'utf8');
if (!/^APP_ENV=local\s*$/m.test(environment))
  throw new Error('This setup command is for APP_ENV=local only.');
const phar = composerPath();
if (phar) run(php, [phar, 'install', '--no-interaction', '--prefer-dist'], api);
else run('composer', ['install', '--no-interaction', '--prefer-dist'], api);
if (!/^APP_KEY=\S+/m.test(environment)) run(php, ['artisan', 'key:generate'], api);
run(php, ['artisan', 'migrate', '--seed', '--force'], api);
run(process.execPath, [npmCli, 'ci'], root);
run(process.execPath, [npmCli, 'ci'], path.join(root, 'apps/web'));
run(process.execPath, [npmCli, 'run', 'build'], path.join(root, 'apps/web'));
console.log('\nSetup complete. Run npm run dev to open the workspace.');
