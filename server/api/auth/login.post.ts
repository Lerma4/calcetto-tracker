import { db } from '../../database/db';
import { users, sessions } from '../../database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.username || !body.password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username e password sono obbligatori',
    });
  }

  // Find user
  const user = db
    .select()
    .from(users)
    .where(eq(users.username, body.username))
    .get();

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenziali non valide',
    });
  }

  // Verify password
  const valid = await bcrypt.compare(body.password, user.password);
  if (!valid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenziali non valide',
    });
  }

  // Create session
  const token = crypto.randomUUID();
  db.insert(sessions).values({
    token,
    userId: user.id,
  }).run();

  // Set cookie (HttpOnly, 7 days)
  setCookie(event, 'auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  return { id: user.id, username: user.username, mustChangePassword: !!user.mustChangePassword };
});
