import { db } from '../database/db';
import { sessions, users } from '../database/schema';
import { eq } from 'drizzle-orm';
import type { H3Event } from 'h3';

/**
 * Validates the auth-token cookie and returns the user, or throws 401.
 */
export async function requireAuth(event: H3Event) {
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
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user) {
    throw createError({ statusCode: 401, message: 'Utente non trovato' });
  }

  return user;
}
