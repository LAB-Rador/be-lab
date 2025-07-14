import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

let prismaClient: PrismaClient;

if (process.env.NODE_ENV === 'production') {
    prismaClient = new PrismaClient({
    log: ['error'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  prismaClient = global.__prisma;
}

export default prismaClient;