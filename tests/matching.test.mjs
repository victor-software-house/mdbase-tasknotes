import test from 'node:test';
import assert from 'node:assert/strict';
import { runCli, makeTempDir, stripAnsi } from './helpers.mjs';

test('exact title match is preferred over substring matches', () => {
  const collectionPath = makeTempDir('mtn-match-');

  let result = runCli(['init', collectionPath]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runCli(['create', '--path', collectionPath, 'Deploy app #work']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runCli(['create', '--path', collectionPath, 'Deploy app release #work']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runCli(['complete', '--path', collectionPath, 'Deploy app']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runCli(['list', '--path', collectionPath, '--status', 'open', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const openTasks = JSON.parse(result.stdout);

  result = runCli(['list', '--path', collectionPath, '--status', 'done', '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const doneTasks = JSON.parse(result.stdout);

  const exact = doneTasks.find((task) => task.title === 'Deploy app');
  const substring = openTasks.find((task) => task.title === 'Deploy app release');
  assert.ok(exact);
  assert.ok(substring);
  assert.equal(exact.status, 'done');
  assert.equal(substring.status, 'open');
});

test('ambiguous substring match returns ranked candidates with path guidance', () => {
  const collectionPath = makeTempDir('mtn-ambig-');

  let result = runCli(['init', collectionPath]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runCli(['create', '--path', collectionPath, 'Plan sprint #work']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runCli(['create', '--path', collectionPath, 'Plan sprint retro #work']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runCli(['show', '--path', collectionPath, 'Plan']);
  assert.equal(result.status, 1);

  const combined = stripAnsi(`${result.stderr}\n${result.stdout}`);
  assert.match(combined, /Ambiguous task reference "Plan"\./);
  assert.match(combined, /Matches \(best first\):/);
  assert.match(combined, /1\./);
  assert.match(combined, /2\./);
  assert.match(combined, /Plan sprint/);
  assert.match(combined, /Plan sprint retro/);
  assert.match(combined, /Use a full path to disambiguate/);
});
