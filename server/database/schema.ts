import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  surname: text('surname').notNull(),
  role: text('role', { enum: ['attaccante', 'portiere', 'indifferente'] }).notNull(),
  nickname: text('nickname'),
  disabled: integer('disabled').default(0).notNull(),
});

export const competitions = sqliteTable('competitions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  winPoints: integer('win_points').default(3).notNull(),
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
