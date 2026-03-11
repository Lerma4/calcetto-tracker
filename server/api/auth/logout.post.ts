import { db } from '../../database/db';
import { sessions } from '../../database/schema';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'auth-token');

  if (token) {
    db.delete(sessions).where(eq(sessions.token, token)).run();
  }

  deleteCookie(event, 'auth-token', { path: '/' });

  return { success: true };
});
