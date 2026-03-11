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

  // Auto-seed: if no users exist, create admin/admin
  const allUsers = db.select().from(users).all();
  if (allUsers.length === 0) {
    const hashedPassword = await bcrypt.hash('admin', 10);
    db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
    }).run();
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
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });

  return { id: user.id, username: user.username };
});
