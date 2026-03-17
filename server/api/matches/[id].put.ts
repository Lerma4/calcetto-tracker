import { db } from '../../database/db';
import { matches } from '../../database/schema';
import { eq } from 'drizzle-orm';
import { broadcastCompetitionUpdate } from '../../utils/ws';

export default defineEventHandler(async (event) => {
  const id = requireIntParam(event, 'id');
  const body = await readBody(event);

  // se passano null, consideriamo la partita da resettare a 'pending'
  if (body.score1 === undefined || body.score2 === undefined) {
    throw createError({ statusCode: 400, message: 'score1 e score2 sono richiesti (possono essere null)' });
  }

  // Verify the match exists and get its competition context
  const [existing] = await db.select().from(matches).where(eq(matches.id, id));
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Partita non trovata' });
  }

  const newState = (body.score1 === null || body.score2 === null) ? 'pending' : 'played';

  const updated = await db.update(matches)
    .set({
      score1: body.score1,
      score2: body.score2,
      state: newState,
    })
    .where(eq(matches.id, id))
    .returning();

  if (updated[0]) {
    broadcastCompetitionUpdate(updated[0].competitionId);
  }

  return updated[0];
});
