import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = process.cwd();
const php =
  process.env.FLOWOPS_PHP ||
  (existsSync(path.join(root, '.local/runtime/php/php.exe'))
    ? path.join(root, '.local/runtime/php/php.exe')
    : 'php');
const script = path.join(root, 'tests/support/race-worker.php');
const options = {
  cwd: root,
  env: {
    ...process.env,
    APP_ENV: 'testing',
    DB_DATABASE: process.env.FLOWOPS_TEST_DATABASE || 'flowops_test',
  },
  windowsHide: true,
};
const directory = path.join(root, '.local', `concurrency-${randomUUID()}`);
await mkdir(directory, { recursive: true });
const fixtures = JSON.parse((await run(php, [script, 'prepare'], options)).stdout);

async function race(name, modes) {
  const fixture = { ...fixtures[name], key: randomUUID() };
  const input = path.join(directory, `${name}.json`);
  const go = path.join(directory, `${name}.go`);
  await writeFile(input, JSON.stringify(fixture));
  const workers = modes.map((mode, index) => {
    const ready = path.join(directory, `${name}-${index}`);
    const process = spawn(php, [script, mode, input, ready, go], options);
    let stdout = '';
    let stderr = '';
    process.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    process.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    const finished = new Promise((resolve, reject) => {
      process.on('error', reject);
      process.on('exit', (code) => {
        if (code !== 0) return reject(new Error(stderr || stdout));
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error(`Unexpected worker output: ${stdout} ${stderr}`));
        }
      });
    });
    return { ready: `${ready}.ready`, finished, process };
  });
  const deadline = Date.now() + 15000;
  while (!workers.every((worker) => existsSync(worker.ready))) {
    if (Date.now() > deadline) {
      workers.forEach((worker) => worker.process.kill());
      throw new Error('Workers did not reach the concurrency barrier.');
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  await writeFile(go, 'go');
  const responses = await Promise.all(workers.map((worker) => worker.finished));
  const state = JSON.parse((await run(php, [script, 'inspect', input], options)).stdout);
  return { responses, state };
}

const decisions = await race('decisions', ['approve', 'reject']);
assert.deepEqual(decisions.responses.map((r) => r.code).sort(), [200, 409]);
assert.equal(decisions.state.decisions, 1);
assert.equal(decisions.state.pending_steps, 0);
assert.ok(['approved', 'rejected'].includes(decisions.state.status));
console.log('PASS: simultaneous approve/reject commits one terminal decision.');

const cancellation = await race('approve-cancel', ['approve', 'cancel']);
assert.deepEqual(cancellation.responses.map((r) => r.code).sort(), [200, 409]);
assert.equal(cancellation.state.pending_steps, 0);
assert.ok(['approved', 'cancelled'].includes(cancellation.state.status));
assert.equal(cancellation.state.decisions, cancellation.state.status === 'approved' ? 1 : 0);
console.log('PASS: simultaneous approve/cancel leaves one consistent terminal outcome.');

const duplicate = await race('duplicate-submit', ['submit', 'submit']);
assert.deepEqual(
  duplicate.responses.map((r) => r.code),
  [200, 200],
);
assert.equal(duplicate.state.steps, 1);
assert.equal(duplicate.state.revision, 2);
assert.equal(duplicate.state.status, 'pending');
console.log('PASS: simultaneous submissions sharing an idempotency key produce one execution.');
