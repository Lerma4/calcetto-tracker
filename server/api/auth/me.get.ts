import { db } from '../../database/db';
import { sessions, users } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth-token');

  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Non autenticato' });
  }

  const session = db
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .get();

  if (!session) {
    throw createError({ statusCode: 401, statusMessage: 'Sessione non valida' });
  }

  const user = db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, session.userId))
    .get();

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Utente non trovato' });
  }

  return user;
});
