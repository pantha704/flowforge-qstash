import { PrismaClient } from '@prisma/client';

// Use globalThis to avoid multiple instances in development
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export * from '@prisma/client';

export const prismaClient = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prismaClient;
