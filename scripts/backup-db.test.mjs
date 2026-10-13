import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import Database from 'better-sqlite3';

test('SQLite backup includes WAL and protects existing files and empty databases', () => {
  const directory = mkdtempSync(join(tmpdir(), 'calcetto-backup-'));
  const script = fileURLToPath(new URL('./backup-db.mjs', import.meta.url));
  mkdirSync(join(directory, 'data'));
  const source = new Database(join(directory, 'data/sqlite.db'));
  try {
    source.pragma('journal_mode = WAL');
    for (const table of ['players', 'competitions', 'teams', 'matches', 'free_matches', 'users', 'sessions']) source.exec(`CREATE TABLE ${table} (id INTEGER PRIMARY KEY)`);
    source.exec('INSERT INTO users VALUES (1); INSERT INTO matches VALUES (91)');
    const backupPath = join(directory, 'snapshot.db');
    const result = JSON.parse(execFileSync(process.execPath, [script, backupPath], { cwd: directory, encoding: 'utf8' }));
    assert.equal(result.counts.matches, 1);
    assert.equal(result.counts.users, 1);
    assert.equal(statSync(backupPath).mode & 0o777, 0o600);
    const original = readFileSync(backupPath);
    assert.notEqual(spawnSync(process.execPath, [script, backupPath], { cwd: directory }).status, 0);
    assert.deepEqual(readFileSync(backupPath), original);
    assert.notEqual(spawnSync(process.execPath, [script, 'data/sqlite.db'], { cwd: directory }).status, 0);
    source.exec('DELETE FROM users');
    const invalid = join(directory, 'invalid.db');
    assert.notEqual(spawnSync(process.execPath, [script, invalid], { cwd: directory }).status, 0);
    assert.equal(existsSync(invalid), false);
    const missing = mkdtempSync(join(tmpdir(), 'calcetto-missing-'));
    try {
      assert.notEqual(spawnSync(process.execPath, [script, 'backup.db'], { cwd: missing }).status, 0);
      assert.equal(existsSync(join(missing, 'backup.db')), false);
    } finally { rmSync(missing, { recursive: true }); }
  } finally {
    source.close();
    rmSync(directory, { recursive: true });
  }
});

test('entrypoint refuses missing/empty migrated data and preserves legacy startup', () => {
  const directory = mkdtempSync(join(tmpdir(), 'calcetto-entrypoint-'));
  try {
    const entrypoint = fileURLToPath(new URL('../docker-entrypoint.sh', import.meta.url));
    mkdirSync(join(directory, 'bin'));
    writeFileSync(join(directory, 'bin/node'), '#!/bin/sh\necho app-started\n', { mode: 0o755 });
    const env = { ...process.env, PATH: `${join(directory, 'bin')}:${process.env.PATH}`, AUTO_DB_PUSH_ON_START: 'false', REQUIRE_EXISTING_DB: 'true' };
    const run = () => spawnSync('sh', [entrypoint], { cwd: directory, env, encoding: 'utf8' });
    assert.equal(run().status, 1);
    mkdirSync(join(directory, 'data'));
    writeFileSync(join(directory, 'data/sqlite.db'), '');
    assert.equal(run().status, 1);
    writeFileSync(join(directory, 'data/sqlite.db'), 'restored');
    assert.match(run().stdout, /app-started/);
    rmSync(join(directory, 'data'), { recursive: true });
    env.REQUIRE_EXISTING_DB = 'false';
    assert.match(run().stdout, /app-started/);
  } finally { rmSync(directory, { recursive: true }); }
});
