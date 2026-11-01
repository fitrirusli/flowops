import path from 'node:path';
import { php, root, run } from './runtime.mjs';

// Set the complete test boundary before Artisan boots; CI may export application settings.
run(php, ['artisan', 'test', '--compact'], path.join(root, 'apps/api'), {
  APP_ENV: 'testing',
  DB_CONNECTION: 'pgsql',
  DB_DATABASE: 'flowops_test',
  DB_URL: '',
  CACHE_STORE: 'array',
  SESSION_DRIVER: 'array',
});
