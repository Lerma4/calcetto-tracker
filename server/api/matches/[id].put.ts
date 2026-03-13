import { db } from '../../database/db';
import { matches } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = requireIntParam(event, 'id');
  const body = await readBody(event);

  if (body.score1 == null || body.score2 == null) {
    throw createError({ statusCode: 400, statusMessage: 'score1 e score2 sono richiesti' });
  }

  // Verify the match exists and get its competition context
  const [existing] = await db.select().from(matches).where(eq(matches.id, id));
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Partita non trovata' });
  }

  const updated = await db.update(matches)
    .set({
      score1: body.score1,
      score2: body.score2,
      state: 'played',
    })
    .where(eq(matches.id, id))
    .returning();

  return updated[0];
});
