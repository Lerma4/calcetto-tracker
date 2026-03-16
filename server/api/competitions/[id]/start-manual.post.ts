import { db } from '../../../database/db';
import { competitions, matches } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = requireIntParam(event, 'id');

  const [comp] = await db.select().from(competitions).where(eq(competitions.id, competitionId));
  if (!comp) {
    throw createError({ statusCode: 404, message: 'Torneo non trovato' });
  }

  if (comp.calendarMode === 'auto') {
    throw createError({ statusCode: 400, message: 'Questo torneo usa già il calendario automatico' });
  }

  if (comp.calendarMode === 'manual') {
    throw createError({ statusCode: 400, message: 'Il calendario manuale è già attivo' });
  }

  const existingMatches = await db.select({ id: matches.id })
    .from(matches)
    .where(eq(matches.competitionId, competitionId))
    .limit(1);

  if (existingMatches.length > 0) {
    throw createError({ statusCode: 400, message: 'Esistono già partite per questo torneo' });
  }

  await db.update(competitions)
    .set({ calendarMode: 'manual' })
    .where(eq(competitions.id, competitionId));

  return { success: true };
});
