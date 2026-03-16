import { db } from '../../database/db';
import { users } from '../../database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../../utils/auth';

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event);

  const body = await readBody(event);

  if (!body.newPassword || body.newPassword.length < 4) {
    throw createError({
      statusCode: 400,
      message: 'La nuova password deve avere almeno 4 caratteri',
    });
  }

  const hashedPassword = await bcrypt.hash(body.newPassword, 10);

  db.update(users)
    .set({ password: hashedPassword, mustChangePassword: 0 })
    .where(eq(users.id, user.id))
    .run();

  return { success: true };
});
