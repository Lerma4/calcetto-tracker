import { desc } from 'drizzle-orm';
import { db } from '../database/db';
import { players } from '../database/schema';

export default defineEventHandler(async () => {
  const rows = await db.select().from(players).orderBy(desc(players.id));
  return rows.map(p => ({ ...p, disabled: !!p.disabled }));
});
