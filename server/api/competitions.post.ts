import { db } from '../database/db';
import { competitions } from '../database/schema';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  if (!body.name) {
    throw createError({
      statusCode: 400,
      message: 'Name is required',
    });
  }

  const newComp = await db.insert(competitions).values({
    name: body.name,
    winPoints: body.winPoints ?? 3,
  }).returning();
  
  return newComp[0];
});
