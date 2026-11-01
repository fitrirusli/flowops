import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundledPhp = path.join(root, '.local/runtime/php/php.exe');
export const php = process.env.FLOWOPS_PHP || (existsSync(bundledPhp) ? bundledPhp : 'php');
export const npmCli =
  process.env.npm_execpath ||
  path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');

export function run(command, args, cwd = root, extraEnv = {}) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env, ...extraEnv },
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(
      `${path.basename(command)} ${args[0] || ''} failed with exit code ${result.status}.`,
    );
}

export function composerPath() {
  const local = path.join(root, '.local/runtime/composer.phar');
  if (process.env.COMPOSER_PHAR) return process.env.COMPOSER_PHAR;
  if (existsSync(local)) return local;
  if (process.platform === 'win32') {
    const where = spawnSync('where.exe', ['composer'], { encoding: 'utf8', windowsHide: true });
    for (const executable of (where.stdout || '').trim().split(/\r?\n/)) {
      const candidate = path.join(path.dirname(executable), 'composer.phar');
      if (existsSync(candidate)) return candidate;
    }
  }
  return null;
}
