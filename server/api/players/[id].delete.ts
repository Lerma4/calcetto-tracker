import { db } from '../../database/db';
import { players, teams } from '../../database/schema';
import { eq, or } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = requireIntParam(event, 'id');

  const linkedTeams = await db.select({ id: teams.id })
    .from(teams)
    .where(or(eq(teams.player1Id, id), eq(teams.player2Id, id)))
    .limit(1);

  if (linkedTeams.length > 0) {
    throw createError({ statusCode: 400, message: 'Impossibile eliminare: il giocatore è collegato a una o più squadre' });
  }

  const deleted = await db.delete(players).where(eq(players.id, id)).returning();
  if (!deleted.length) {
    throw createError({ statusCode: 404, message: 'Player not found' });
  }
  return deleted[0];
});
