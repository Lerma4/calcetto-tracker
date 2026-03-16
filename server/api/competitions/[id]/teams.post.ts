import { db } from '../../../database/db';
import { teams, competitions, players } from '../../../database/schema';
import { eq, or } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = requireIntParam(event, 'id');
  const body = await readBody(event);

  if (!body.name || !body.player1Id || !body.player2Id) {
    throw createError({ statusCode: 400, message: 'Name, player1Id and player2Id are required' });
  }

  if (body.player1Id === body.player2Id) {
    throw createError({ statusCode: 400, message: 'I due giocatori devono essere diversi' });
  }

  const comp = await db.select().from(competitions).where(eq(competitions.id, competitionId)).limit(1);
  if (!comp.length) {
    throw createError({ statusCode: 404, message: 'Competition not found' });
  }

  const existingTeams = await db.select().from(teams).where(eq(teams.competitionId, competitionId));
  for (const playerId of [body.player1Id, body.player2Id]) {
    const alreadyInTeam = existingTeams.some(
      (t) => t.player1Id === playerId || t.player2Id === playerId
    );
    if (alreadyInTeam) {
      const playerRecord = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
      const p = playerRecord[0];
      throw createError({
        statusCode: 400,
        message: `Il giocatore ${p.name} ${p.surname} è già in una squadra in questa arena`,
      });
    }
  }

  const newTeam = await db.insert(teams).values({
    name: body.name,
    player1Id: body.player1Id,
    player2Id: body.player2Id,
    competitionId,
  }).returning();

  return newTeam[0];
});
