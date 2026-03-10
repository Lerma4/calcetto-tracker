import { desc } from 'drizzle-orm';
import { db } from '../database/db';
import { players } from '../database/schema';

export default defineEventHandler(async (event) => {
  return await db.select().from(players).orderBy(desc(players.id));
});
