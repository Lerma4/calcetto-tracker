import { db } from '../database/db';
import { players } from '../database/schema';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.name || !body.surname) {
    throw createError({
      statusCode: 400,
      message: 'Name and surname are required',
    });
  }

  const newPlayer = await db.insert(players).values({
    name: body.name,
    surname: body.surname,
    role: body.role,
    nickname: body.nickname,
  }).returning();
  
  return newPlayer[0];
});
