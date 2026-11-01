import path from 'node:path';
import { php, root, run } from './runtime.mjs';

run(php, ['artisan', 'test', '--compact'], path.join(root, 'apps/api'), { APP_ENV: 'testing' });
