import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { runCli, makeTempDir, stripAnsi } from './helpers.mjs';

function removeTitleField(collectionPath) {
  const tasksDir = join(collectionPath, 'tasks');
  const taskFiles = readdirSync(tasksDir).filter((name) => name.endsWith('.md'));
  assert.equal(taskFiles.length, 1, 'expected exactly one task file');

  const taskFile = taskFiles[0];
  const taskPath = join(tasksDir, taskFile);
  const original = readFileSync(taskPath, 'utf8');
  const updated = original.replace(/^title:.*\n/m, '');
  assert.notEqual(updated, original, 'expected title field in frontmatter');
  writeFileSync(taskPath, updated);

  return taskFile.replace(/\.md$/, '');
}

test('list/show/complete resolve task by filename when title field is missing', () => {
  const collectionPath = makeTempDir('mtn-filename-title-');

  let result = runCli(['init', collectionPath]);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  result = runCli(['create', '--path', collectionPath, 'FilenameFallbackTask #work']);
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const taskName = removeTitleField(collectionPath);
  assert.equal(taskName, 'FilenameFallbackTask');

  result = runCli(['list', '--path', collectionPath]);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(stripAnsi(result.stdout), /FilenameFallbackTask/);

  result = runCli(['list', '--path', collectionPath, '--json']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const tasks = JSON.parse(result.stdout);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0].title, 'FilenameFallbackTask');

  result = runCli(['show', '--path', collectionPath, 'FilenameFallbackTask']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(stripAnsi(result.stdout), /FilenameFallbackTask/);

  result = runCli(['complete', '--path', collectionPath, 'FilenameFallbackTask']);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(stripAnsi(result.stdout), /Completed:\s+FilenameFallbackTask/);
});
