import { npmCli, root, run } from './runtime.mjs';

for (const script of ['test:api', 'test:web', 'test:concurrency', 'build']) {
  run(process.execPath, [npmCli, 'run', script], root);
}
