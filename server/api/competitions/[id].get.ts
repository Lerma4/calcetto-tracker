import { db } from '../../database/db';
import { competitions, teams, matches, players } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = requireIntParam(event, 'id');

  const comp = await db.select().from(competitions).where(eq(competitions.id, id)).limit(1);

  if (!comp.length) {
    throw createError({ statusCode: 404, message: 'Competition not found' });
  }

  const compTeams = await db.select().from(teams).where(eq(teams.competitionId, id));

  const teamsWithPlayers = await Promise.all(
    compTeams.map(async (team) => {
      const [player1] = await db.select().from(players).where(eq(players.id, team.player1Id));
      const [player2] = await db.select().from(players).where(eq(players.id, team.player2Id));
      return { ...team, player1, player2 };
    })
  );

  const compMatches = await db.select().from(matches).where(eq(matches.competitionId, id));

  return {
    ...comp[0],
    teams: teamsWithPlayers,
    matches: compMatches,
  };
});
