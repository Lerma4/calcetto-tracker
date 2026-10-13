import assert from 'node:assert/strict';
import { open, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import Database from 'better-sqlite3';

const destination = process.argv[2];
assert(process.argv.length === 3, 'Usage: node scripts/backup-db.mjs /path/to/new-backup.db');
assert.notEqual(resolve(destination), resolve('data/sqlite.db'), 'Backup cannot overwrite the source');

const source = new Database('data/sqlite.db', { readonly: true, fileMustExist: true });
const tables = ['players', 'competitions', 'teams', 'matches', 'free_matches', 'users', 'sessions'];
let reserved = false;
try {
  assert.equal(source.pragma('quick_check', { simple: true }), 'ok', 'Source database is corrupt');
  const file = await open(destination, 'wx', 0o600);
  reserved = true;
  await file.close();
  await source.backup(destination);
  const backup = new Database(destination, { readonly: true, fileMustExist: true });
  try {
    assert.equal(backup.pragma('integrity_check', { simple: true }), 'ok', 'Backup is corrupt');
    const counts = Object.fromEntries(tables.map(table => [table, backup.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n]));
    assert(counts.users > 0, 'Backup has no users: refusing an uninitialized database');
    console.log(JSON.stringify({ backup: destination, counts }));
  } finally {
    backup.close();
  }
} catch (error) {
  if (reserved) await unlink(destination);
  throw error;
} finally {
  source.close();
}
