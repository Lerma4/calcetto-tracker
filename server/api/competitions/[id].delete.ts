import { db } from '../../database/db';
import { competitions, teams, matches } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { broadcastCompetitionUpdate } from '../../utils/ws';

export default defineEventHandler(async (event) => {
  const competitionId = requireIntParam(event, 'id');

  const [comp] = await db.select().from(competitions).where(eq(competitions.id, competitionId));
  if (!comp) {
    throw createError({ statusCode: 404, message: 'Torneo non trovato' });
  }

  // Delete in order: matches → teams → competition
  await db.delete(matches).where(eq(matches.competitionId, competitionId));
  await db.delete(teams).where(eq(teams.competitionId, competitionId));
  await db.delete(competitions).where(eq(competitions.id, competitionId));

  broadcastCompetitionUpdate(competitionId);

  return { success: true };
});
