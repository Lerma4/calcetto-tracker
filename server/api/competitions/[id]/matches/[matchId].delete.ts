import { db } from '../../../../database/db';
import { matches } from '../../../../database/schema';
import { eq, and } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const competitionId = Number(getRouterParam(event, 'id'));
  const matchId = Number(getRouterParam(event, 'matchId'));

  const [deleted] = await db.delete(matches)
    .where(and(eq(matches.id, matchId), eq(matches.competitionId, competitionId)))
    .returning();

  if (!deleted) {
    throw createError({ statusCode: 404, statusMessage: 'Partita non trovata' });
  }

  const remaining = await db.select().from(matches)
    .where(eq(matches.competitionId, competitionId));

  const usedDays = [...new Set(remaining.map(m => m.matchday))].sort((a, b) => a - b);

  for (let i = 0; i < usedDays.length; i++) {
    const oldDay = usedDays[i]!;
    const newDay = i + 1;
    if (oldDay !== newDay) {
      await db.update(matches)
        .set({ matchday: newDay })
        .where(and(eq(matches.competitionId, competitionId), eq(matches.matchday, oldDay)));
    }
  }

  return { success: true };
});
