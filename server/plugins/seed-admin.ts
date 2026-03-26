import { db } from '../database/db';
import { users } from '../database/schema';
import bcrypt from 'bcryptjs';

export default defineNitroPlugin(async () => {
  const allUsers = await db.select().from(users).limit(1);
  if (allUsers.length === 0) {
    const hashedPassword = await bcrypt.hash('admin', 10);
    await db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      mustChangePassword: true,
    });
    console.log('[seed] Default admin user created');
  }
});
