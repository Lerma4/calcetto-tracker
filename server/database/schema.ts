import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  surname: text('surname').notNull(),
  role: text('role', { enum: ['attaccante', 'portiere', 'indifferente'] }).notNull(),
  nickname: text('nickname'),
  disabled: integer('disabled').default(0).notNull(),
  elo: integer('elo').default(1500).notNull(),
});

export const competitions = sqliteTable('competitions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  winPoints: integer('win_points').default(3).notNull(),
  calendarMode: text('calendar_mode', { enum: ['auto', 'manual'] }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  player1Id: integer('player1_id').references(() => players.id).notNull(),
  player2Id: integer('player2_id').references(() => players.id).notNull(),
  competitionId: integer('competition_id').references(() => competitions.id).notNull(),
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  team1Id: integer('team1_id').references(() => teams.id).notNull(),
  team2Id: integer('team2_id').references(() => teams.id).notNull(),
  score1: integer('score1').default(0),
  score2: integer('score2').default(0),
  state: text('state', { enum: ['pending', 'played'] }).default('pending').notNull(),
  matchday: integer('matchday').notNull(),
  competitionId: integer('competition_id').references(() => competitions.id).notNull(),
});

export const freeMatches = sqliteTable('free_matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  team1Player1Id: integer('team1_player1_id').references(() => players.id).notNull(),
  team1Player2Id: integer('team1_player2_id').references(() => players.id).notNull(),
  team2Player1Id: integer('team2_player1_id').references(() => players.id).notNull(),
  team2Player2Id: integer('team2_player2_id').references(() => players.id).notNull(),
  score1: integer('score1').notNull(),
  score2: integer('score2').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  mustChangePassword: integer('must_change_password').default(0).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  token: text('token').notNull().unique(),
  userId: integer('user_id').references(() => users.id).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});
