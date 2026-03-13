import { db } from '../../../../database/db';
import { teams, matches } from '../../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = requireIntParam(event, 'id');
  const teamId = requireIntParam(event, 'teamId');

  const existingMatches = await db.select({ id: matches.id })
    .from(matches)
    .where(eq(matches.competitionId, competitionId))
    .limit(1);

  if (existingMatches.length > 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Impossibile eliminare: il calendario è già stato generato',
    });
  }

  const deleted = await db.delete(teams)
    .where(eq(teams.id, teamId))
    .returning();

  if (!deleted.length) {
    throw createError({ statusCode: 404, statusMessage: 'Team not found' });
  }

  return deleted[0];
});
