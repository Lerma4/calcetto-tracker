import Database from 'better-sqlite3';
import pg from 'pg';

const sourcePath = process.env.SQLITE_PATH ?? './data/sqlite.db';
const destinationUrl = process.env.DATABASE_URL;
const truncateFirst = process.argv.includes('--truncate');

if (!destinationUrl) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sqlite = new Database(sourcePath, { readonly: true });
const client = new pg.Client({ connectionString: destinationUrl });

const tables = [
  'players',
  'competitions',
  'teams',
  'matches',
  'free_matches',
  'users',
  'sessions',
];

const tableData = {
  players: sqlite.prepare('SELECT id, name, surname, role, nickname, disabled, elo FROM players ORDER BY id').all(),
  competitions: sqlite.prepare('SELECT id, name, win_points AS "winPoints", calendar_mode AS "calendarMode", created_at AS "createdAt" FROM competitions ORDER BY id').all(),
  teams: sqlite.prepare('SELECT id, name, player1_id AS "player1Id", player2_id AS "player2Id", competition_id AS "competitionId" FROM teams ORDER BY id').all(),
  matches: sqlite.prepare('SELECT id, team1_id AS "team1Id", team2_id AS "team2Id", score1, score2, state, matchday, competition_id AS "competitionId" FROM matches ORDER BY id').all(),
  free_matches: sqlite.prepare('SELECT id, team1_player1_id AS "team1Player1Id", team1_player2_id AS "team1Player2Id", team2_player1_id AS "team2Player1Id", team2_player2_id AS "team2Player2Id", score1, score2, created_at AS "createdAt" FROM free_matches ORDER BY id').all(),
  users: sqlite.prepare('SELECT id, username, password, must_change_password AS "mustChangePassword" FROM users ORDER BY id').all(),
  sessions: sqlite.prepare('SELECT id, token, user_id AS "userId", created_at AS "createdAt" FROM sessions ORDER BY id').all(),
};

function normalizeTimestamp(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    const milliseconds = value < 1_000_000_000_000 ? value * 1000 : value;
    return new Date(milliseconds).toISOString();
  }

  return new Date(value).toISOString();
}

function normalizeBoolean(value) {
  return Boolean(value);
}

async function ensureEmptyDestination() {
  for (const table of tables) {
    const result = await client.query(`SELECT COUNT(*)::int AS count FROM ${table}`);
    if (result.rows[0].count > 0) {
      throw new Error(`Destination table ${table} is not empty. Re-run with --truncate if you want to overwrite it.`);
    }
  }
}

async function resetSequence(table) {
  await client.query(
    `SELECT setval(pg_get_serial_sequence($1, 'id'), COALESCE((SELECT MAX(id) FROM ${table}), 1), EXISTS (SELECT 1 FROM ${table}))`,
    [table],
  );
}

await client.connect();

try {
  await client.query('BEGIN');

  if (truncateFirst) {
    await client.query('TRUNCATE TABLE sessions, users, free_matches, matches, teams, competitions, players RESTART IDENTITY CASCADE');
  } else {
    await ensureEmptyDestination();
  }

  for (const row of tableData.players) {
    await client.query(
      'INSERT INTO players (id, name, surname, role, nickname, disabled, elo) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [row.id, row.name, row.surname, row.role, row.nickname, normalizeBoolean(row.disabled), row.elo],
    );
  }

  for (const row of tableData.competitions) {
    await client.query(
      'INSERT INTO competitions (id, name, win_points, calendar_mode, created_at) VALUES ($1, $2, $3, $4, $5)',
      [row.id, row.name, row.winPoints, row.calendarMode, normalizeTimestamp(row.createdAt)],
    );
  }

  for (const row of tableData.teams) {
    await client.query(
      'INSERT INTO teams (id, name, player1_id, player2_id, competition_id) VALUES ($1, $2, $3, $4, $5)',
      [row.id, row.name, row.player1Id, row.player2Id, row.competitionId],
    );
  }

  for (const row of tableData.matches) {
    await client.query(
      'INSERT INTO matches (id, team1_id, team2_id, score1, score2, state, matchday, competition_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [row.id, row.team1Id, row.team2Id, row.score1, row.score2, row.state, row.matchday, row.competitionId],
    );
  }

  for (const row of tableData.free_matches) {
    await client.query(
      'INSERT INTO free_matches (id, team1_player1_id, team1_player2_id, team2_player1_id, team2_player2_id, score1, score2, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [row.id, row.team1Player1Id, row.team1Player2Id, row.team2Player1Id, row.team2Player2Id, row.score1, row.score2, normalizeTimestamp(row.createdAt)],
    );
  }

  for (const row of tableData.users) {
    await client.query(
      'INSERT INTO users (id, username, password, must_change_password) VALUES ($1, $2, $3, $4)',
      [row.id, row.username, row.password, normalizeBoolean(row.mustChangePassword)],
    );
  }

  for (const row of tableData.sessions) {
    await client.query(
      'INSERT INTO sessions (id, token, user_id, created_at) VALUES ($1, $2, $3, $4)',
      [row.id, row.token, row.userId, normalizeTimestamp(row.createdAt)],
    );
  }

  for (const table of tables) {
    await resetSequence(table);
  }

  await client.query('COMMIT');
  console.log('SQLite data imported into PostgreSQL successfully.');
} catch (error) {
  await client.query('ROLLBACK');
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  sqlite.close();
  await client.end();
}
