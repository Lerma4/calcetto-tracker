import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const playerRoleEnum = pgEnum('player_role', ['attaccante', 'portiere', 'indifferente']);
export const calendarModeEnum = pgEnum('calendar_mode', ['auto', 'manual']);
export const matchStateEnum = pgEnum('match_state', ['pending', 'played']);

export const players = pgTable('players', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  surname: text('surname').notNull(),
  role: playerRoleEnum('role').notNull(),
  nickname: text('nickname'),
  disabled: boolean('disabled').default(false).notNull(),
  elo: integer('elo').default(1500).notNull(),
}, (table) => ({
  activeIdx: index('players_disabled_idx').on(table.disabled),
}));

export const competitions = pgTable('competitions', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  winPoints: integer('win_points').default(3).notNull(),
  calendarMode: calendarModeEnum('calendar_mode'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  player1Id: integer('player1_id').references(() => players.id, { onDelete: 'restrict' }).notNull(),
  player2Id: integer('player2_id').references(() => players.id, { onDelete: 'restrict' }).notNull(),
  competitionId: integer('competition_id').references(() => competitions.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  competitionIdx: index('teams_competition_idx').on(table.competitionId),
  playersDifferent: check('teams_players_different_chk', sql`${table.player1Id} <> ${table.player2Id}`),
}));

export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  team1Id: integer('team1_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  team2Id: integer('team2_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  score1: integer('score1').default(0),
  score2: integer('score2').default(0),
  state: matchStateEnum('state').default('pending').notNull(),
  matchday: integer('matchday').notNull(),
  competitionId: integer('competition_id').references(() => competitions.id, { onDelete: 'cascade' }).notNull(),
}, (table) => ({
  competitionIdx: index('matches_competition_idx').on(table.competitionId),
  matchdayIdx: index('matches_competition_matchday_idx').on(table.competitionId, table.matchday),
  teamsDifferent: check('matches_teams_different_chk', sql`${table.team1Id} <> ${table.team2Id}`),
}));

export const freeMatches = pgTable('free_matches', {
  id: serial('id').primaryKey(),
  team1Player1Id: integer('team1_player1_id').references(() => players.id, { onDelete: 'restrict' }).notNull(),
  team1Player2Id: integer('team1_player2_id').references(() => players.id, { onDelete: 'restrict' }).notNull(),
  team2Player1Id: integer('team2_player1_id').references(() => players.id, { onDelete: 'restrict' }).notNull(),
  team2Player2Id: integer('team2_player2_id').references(() => players.id, { onDelete: 'restrict' }).notNull(),
  score1: integer('score1').notNull(),
  score2: integer('score2').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  createdIdx: index('free_matches_created_at_idx').on(table.createdAt),
}));

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull(),
  password: text('password').notNull(),
  mustChangePassword: boolean('must_change_password').default(false).notNull(),
}, (table) => ({
  usernameUnique: uniqueIndex('users_username_uq').on(table.username),
}));

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  token: text('token').notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
}, (table) => ({
  tokenUnique: uniqueIndex('sessions_token_uq').on(table.token),
  userIdx: index('sessions_user_id_idx').on(table.userId),
}));
