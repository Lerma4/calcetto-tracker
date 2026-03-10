import { desc } from 'drizzle-orm';
import { db } from '../database/db';
import { competitions } from '../database/schema';

export default defineEventHandler(async (event) => {
  return await db.select().from(competitions).orderBy(desc(competitions.id));
});
