import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ANSI_RE = /\u001b\[[0-9;]*m/g;

export function makeTempDir(prefix = 'mtn-test-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function stripAnsi(text) {
  return text.replace(ANSI_RE, '');
}

export function runCli(args, opts = {}) {
  const runDir = makeTempDir('mtn-run-');
  const stdoutPath = join(runDir, 'stdout.txt');
  const stderrPath = join(runDir, 'stderr.txt');
  const shellArgs = args.map(shellQuote).join(' ');
  const command = `node dist/cli.js ${shellArgs} > ${shellQuote(stdoutPath)} 2> ${shellQuote(stderrPath)}`;

  const result = spawnSync('bash', ['-lc', command], {
    cwd: opts.cwd,
    encoding: 'utf8',
    env: { ...process.env, ...(opts.env || {}) },
  });

  return {
    status: result.status,
    stdout: readFileSync(stdoutPath, 'utf8'),
    stderr: readFileSync(stderrPath, 'utf8'),
  };
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}
