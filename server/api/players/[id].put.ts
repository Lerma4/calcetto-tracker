import { db } from '../../database/db';
import { players } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'));
  const body = await readBody(event);

  if (!body.name || !body.surname) {
    throw createError({ statusCode: 400, statusMessage: 'Name and surname are required' });
  }

  const updated = await db.update(players)
    .set({ name: body.name, surname: body.surname, role: body.role, nickname: body.nickname })
    .where(eq(players.id, id))
    .returning();

  if (!updated.length) {
    throw createError({ statusCode: 404, statusMessage: 'Player not found' });
  }
  return updated[0];
});
