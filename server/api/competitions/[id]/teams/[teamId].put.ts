import { db } from '../../../../database/db';
import { teams, matches, players } from '../../../../database/schema';
import { eq, and, ne } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = requireIntParam(event, 'id');
  const teamId = requireIntParam(event, 'teamId');
  const body = await readBody(event);

  if (!body.name || !body.player1Id || !body.player2Id) {
    throw createError({ statusCode: 400, statusMessage: 'Name, player1Id and player2Id are required' });
  }

  if (body.player1Id === body.player2Id) {
    throw createError({ statusCode: 400, statusMessage: 'I due giocatori devono essere diversi' });
  }

  // Block editing if all matches are played (competition complete)
  const allMatches = await db.select({ state: matches.state })
    .from(matches)
    .where(eq(matches.competitionId, competitionId));

  if (allMatches.length > 0 && allMatches.every(m => m.state === 'played')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Impossibile modificare: la competizione è già conclusa',
    });
  }

  // Check players aren't already in other teams in this competition
  const otherTeams = await db.select().from(teams)
    .where(and(eq(teams.competitionId, competitionId), ne(teams.id, teamId)));

  for (const playerId of [body.player1Id, body.player2Id]) {
    const alreadyInTeam = otherTeams.some(
      (t) => t.player1Id === playerId || t.player2Id === playerId
    );
    if (alreadyInTeam) {
      const playerRecord = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
      const p = playerRecord[0];
      throw createError({
        statusCode: 400,
        statusMessage: `Il giocatore ${p.name} ${p.surname} è già in un'altra squadra in questo torneo`,
      });
    }
  }

  const updated = await db.update(teams)
    .set({ name: body.name, player1Id: body.player1Id, player2Id: body.player2Id })
    .where(eq(teams.id, teamId))
    .returning();

  if (!updated.length) {
    throw createError({ statusCode: 404, statusMessage: 'Squadra non trovata' });
  }

  return updated[0];
});
