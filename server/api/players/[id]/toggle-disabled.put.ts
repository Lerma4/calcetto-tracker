import { db } from '../../../database/db';
import { players } from '../../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));

  const player = await db.select().from(players).where(eq(players.id, id)).limit(1);

  if (!player.length) {
    throw createError({ statusCode: 404, statusMessage: 'Player not found' });
  }

  const currentPlayer = player[0]!;
  const updated = await db.update(players)
    .set({ disabled: currentPlayer.disabled ? 0 : 1 })
    .where(eq(players.id, id))
    .returning();

  return updated[0];
});
