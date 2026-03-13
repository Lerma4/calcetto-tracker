import { db } from '../database/db';
import { users } from '../database/schema';
import bcrypt from 'bcryptjs';

export default defineNitroPlugin(async () => {
  const allUsers = db.select().from(users).all();
  if (allUsers.length === 0) {
    const hashedPassword = await bcrypt.hash('admin', 10);
    db.insert(users).values({
      username: 'admin',
      password: hashedPassword,
      mustChangePassword: 1,
    }).run();
    console.log('[seed] Default admin user created');
  }
});
