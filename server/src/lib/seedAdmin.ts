import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

export const ADMIN_EMAIL = 'admin@choiceclash.com';
export const DEFAULT_ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || 'Admin123!';

export async function seedAdmin(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existing) {
    if (existing.role !== 'ADMIN' || existing.isBanned) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN', isBanned: false },
      });
    }
    return;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: ADMIN_EMAIL,
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log(`Seeded admin account: ${ADMIN_EMAIL}`);
}
