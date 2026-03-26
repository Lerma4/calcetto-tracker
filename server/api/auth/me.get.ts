import { db } from '../../database/db';
import { sessions, users } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth-token');

  if (!token) {
    throw createError({ statusCode: 401, message: 'Non autenticato' });
  }

  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);

  if (!session) {
    throw createError({ statusCode: 401, message: 'Sessione non valida' });
  }

  const [user] = await db
    .select({ id: users.id, username: users.username, mustChangePassword: users.mustChangePassword })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    throw createError({ statusCode: 401, message: 'Utente non trovato' });
  }

  return user;
});
