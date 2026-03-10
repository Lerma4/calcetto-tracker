import { db } from '../../database/db';
import { matches } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  const body = await readBody(event);

  if (body.score1 == null || body.score2 == null) {
    throw createError({ statusCode: 400, statusMessage: 'score1 and score2 are required' });
  }

  const updated = await db.update(matches)
    .set({
      score1: body.score1,
      score2: body.score2,
      state: 'played',
    })
    .where(eq(matches.id, id))
    .returning();

  if (!updated.length) {
    throw createError({ statusCode: 404, statusMessage: 'Match not found' });
  }

  return updated[0];
});
